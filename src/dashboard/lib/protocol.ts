import {
  encodeAbiParameters,
  getAddress,
  isAddress,
  keccak256,
  parseUnits,
  toBytes,
  toHex,
  type Address,
  type Hex,
} from "viem";
import { NATIVE } from "./chains";
import { publicClient } from "./clients";
import { RELAYER_URL } from "./env";
import type { ActivityItem } from "./data";
import { limitKey, type Authorization, type WalletData } from "./store";

/* ================================================================ domain */

/**
 * EIP-712 domain for every Spectral signature. No verifyingContract yet: the
 * on-chain verifier is not deployed, so signatures are scoped by name, version
 * and chain. Adding the contract later is a version bump.
 */
export const domain = (chainId: number) => ({ name: "Spectral", version: "1", chainId }) as const;

/* ============================================================ credential */

export const CREDENTIAL_TYPES = {
  Credential: [
    { name: "holder", type: "address" },
    { name: "statement", type: "string" },
    { name: "scope", type: "uint256" },
  ],
} as const;

export const CREDENTIAL_STATEMENT =
  "Issue my Spectral spending credential for this address. This signature does not move funds and does not approve any spending.";

export const credentialMessage = (holder: Address, chainId: number) => ({
  holder,
  statement: CREDENTIAL_STATEMENT,
  scope: BigInt(chainId),
});

/**
 * Derives the public credential from the holder's signature. The signature is
 * the secret: it is hashed immediately and never stored. Deterministic signers
 * (plain EOAs) re-derive the same ID from the same wallet every time.
 */
export function deriveCredential(signature: Hex, holder: Address, chainId: number) {
  const secret = keccak256(signature);
  const id = keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "string" }], [secret, "spectral.credential.id"]));
  const commitment = keccak256(
    encodeAbiParameters([{ type: "bytes32" }, { type: "address" }, { type: "uint256" }], [id, holder, BigInt(chainId)]),
  );
  return { id, commitment };
}

/** Checks a fresh credential signature against the chain (EOA or ERC-1271 smart account). */
export async function verifyCredentialSignature(holder: Address, chainId: number, signature: Hex) {
  return publicClient(chainId).verifyTypedData({
    address: holder,
    domain: domain(chainId),
    types: CREDENTIAL_TYPES,
    primaryType: "Credential",
    message: credentialMessage(holder, chainId),
    signature,
  });
}

/* ========================================================= authorization */

export const PAYMENT_TYPES = {
  PaymentAuthorization: [
    { name: "credential", type: "bytes32" },
    { name: "recipient", type: "address" },
    { name: "token", type: "address" },
    { name: "amount", type: "uint256" },
    { name: "nonce", type: "bytes32" },
    { name: "deadline", type: "uint256" },
  ],
} as const;

export const AUTH_TTL_MS = 15 * 60_000;

export const newNonce = (): Hex => toHex(crypto.getRandomValues(new Uint8Array(32)));

export type PaymentDraft = {
  chainId: number;
  credential: Hex;
  recipient: Address;
  token: { address: Address; symbol: string; decimals: number };
  amount: bigint;
  nonce: Hex;
  deadline: number;
};

/** A fresh draft: new random nonce, valid for AUTH_TTL_MS from now. */
export function newDraft(input: Omit<PaymentDraft, "nonce" | "deadline">): PaymentDraft {
  return { ...input, nonce: newNonce(), deadline: Date.now() + AUTH_TTL_MS };
}

export const paymentMessage = (d: PaymentDraft) => ({
  credential: d.credential,
  recipient: d.recipient,
  token: d.token.address,
  amount: d.amount,
  nonce: d.nonce,
  deadline: BigInt(Math.floor(d.deadline / 1000)),
});

/** Parses a user-typed amount; returns null when it isn't a valid positive number for this token. */
export function parseAmount(input: string, decimals: number): bigint | null {
  const t = input.trim();
  if (!/^\d*\.?\d*$/.test(t) || t === "" || t === ".") return null;
  const [, frac = ""] = t.split(".");
  if (frac.length > decimals) return null;
  try {
    const v = parseUnits(t, decimals);
    return v > 0n ? v : null;
  } catch {
    return null;
  }
}

const COUNTS_TOWARD_LIMIT = new Set<Authorization["status"]>(["signed", "submitted", "settled", "relayed"]);

/** Amount already authorized for a token in the trailing 24 hours. */
export function spentToday(data: WalletData, chainId: number, token: Address, now = Date.now()): bigint {
  let sum = 0n;
  for (const a of data.authorizations) {
    if (a.chainId !== chainId || a.token.address.toLowerCase() !== token.toLowerCase()) continue;
    if (!COUNTS_TOWARD_LIMIT.has(a.status) || now - a.createdAt > 86_400_000) continue;
    sum += BigInt(a.amount);
  }
  return sum;
}

export type PolicyIssue = { level: "block" | "warn"; text: string };

/**
 * The spending rules a credential enforces before anything is signed.
 * Blocking issues disable the signature; warnings are shown but allowed.
 */
export function checkPolicy(
  data: WalletData,
  input: { chainId: number; owner: Address; recipient: string; token: PaymentDraft["token"] | null; amount: bigint | null; balance: bigint | null },
): PolicyIssue[] {
  const issues: PolicyIssue[] = [];
  if (!data.credential) issues.push({ level: "block", text: "Issue a credential before authorizing payments." });
  else if (data.credential.chainId !== input.chainId)
    issues.push({ level: "block", text: "Your credential was issued on another network. Switch back or issue one here." });

  const r = input.recipient.trim();
  if (!r) issues.push({ level: "block", text: "Enter a recipient address." });
  else if (!isAddress(r)) issues.push({ level: "block", text: "The recipient is not a valid address." });
  else {
    if (getAddress(r) === getAddress(input.owner)) issues.push({ level: "block", text: "You can't pay your own address." });
    const known = data.policy.merchants.some((m) => m.address.toLowerCase() === r.toLowerCase());
    if (data.policy.allowlistOnly && !known)
      issues.push({ level: "block", text: "Allowlist-only is on and this recipient isn't on your merchant list." });
    else if (!known) issues.push({ level: "warn", text: "This recipient isn't on your merchant list." });
  }

  if (!input.token) issues.push({ level: "block", text: "Choose an asset." });
  if (input.amount == null) issues.push({ level: "block", text: "Enter an amount." });

  if (input.token && input.amount != null) {
    if (input.balance != null && input.amount > input.balance)
      issues.push({ level: "block", text: `Amount exceeds your ${input.token.symbol} balance.` });
    const cap = data.policy.dailyLimits[limitKey(input.chainId, input.token.address)];
    if (cap) {
      const capRaw = parseAmount(cap, input.token.decimals) ?? 0n;
      const used = spentToday(data, input.chainId, input.token.address);
      if (used + input.amount > capRaw)
        issues.push({ level: "block", text: `This would exceed your daily ${input.token.symbol} limit of ${cap}.` });
    }
  }
  return issues;
}

export const isNative = (token: Address) => token.toLowerCase() === NATIVE;

/* ============================================================== relayer */

export type RelayerHealth = { ok: boolean; detail: string };

export async function relayerHealth(): Promise<RelayerHealth> {
  if (!RELAYER_URL) return { ok: false, detail: "No relayer configured" };
  try {
    const r = await fetch(`${RELAYER_URL}/health`, { headers: { accept: "application/json" } });
    return r.ok ? { ok: true, detail: "Online" } : { ok: false, detail: `Responded ${r.status}` };
  } catch (e) {
    return { ok: false, detail: `Unreachable (${(e as Error).message})` };
  }
}

/**
 * Hands a signed authorization to the relayer, which pays gas and submits it.
 * Expected response: `{ id: string, txHash?: string }`.
 */
export async function submitToRelayer(a: Authorization): Promise<{ id: string; txHash?: Hex }> {
  const body = {
    chainId: a.chainId,
    authorization: {
      credential: a.credential,
      recipient: a.recipient,
      token: a.token.address,
      amount: a.amount,
      nonce: a.id,
      deadline: Math.floor(a.deadline / 1000),
    },
    signature: a.signature,
  };
  const r = await fetch(`${RELAYER_URL}/v1/authorizations`, {
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json" },
    body: JSON.stringify(body),
  });
  const text = await r.text();
  if (!r.ok) throw new Error(`Relayer rejected the authorization (${r.status}): ${text.slice(0, 200)}`);
  const j = JSON.parse(text) as { id?: string; txHash?: string };
  return { id: j.id ?? "accepted", txHash: j.txHash as Hex | undefined };
}

/* ========================================================== audit reports */

export type AuditReport = {
  schema: "spectral.audit/1";
  holder: Address;
  chainId: number;
  credential: Hex | null;
  period: { from: string; to: string };
  generatedAt: string;
  authorizations: {
    nonce: Hex;
    createdAt: string;
    recipient: Address;
    token: string;
    tokenAddress: Address;
    amount: string;
    status: string;
    txHash: Hex | null;
    signature: Hex;
  }[];
  settlements: {
    txHash: Hex;
    time: string;
    direction: string;
    counterparty: Address | null;
    token: string | null;
    amount: string;
  }[];
  totals: Record<string, { out: string; in: string }>;
};

export type SignedAuditFile = { report: AuditReport; digest: Hex; message: string; signature: Hex };

/** Stable key order, so the digest never depends on object insertion order. */
function canonical(v: unknown): string {
  if (Array.isArray(v)) return `[${v.map(canonical).join(",")}]`;
  if (v && typeof v === "object")
    return `{${Object.keys(v as object)
      .sort()
      .map((k) => `${JSON.stringify(k)}:${canonical((v as Record<string, unknown>)[k])}`)
      .join(",")}}`;
  return JSON.stringify(v);
}

export const reportDigest = (r: AuditReport): Hex => keccak256(toBytes(canonical(r)));

export const reportMessage = (r: AuditReport, digest: Hex) =>
  [
    "Spectral audit report",
    `Holder: ${r.holder}`,
    `Chain: ${r.chainId}`,
    `Period: ${r.period.from} to ${r.period.to}`,
    `Entries: ${r.authorizations.length + r.settlements.length}`,
    `Digest: ${digest}`,
  ].join("\n");

export function buildAuditReport(
  data: WalletData,
  input: { holder: Address; chainId: number; from: number; to: number; activity: ActivityItem[] },
): AuditReport {
  const inRange = (t: number) => t >= input.from && t <= input.to;
  const totals: AuditReport["totals"] = {};
  const bump = (sym: string, key: "out" | "in", decimals: number, amount: bigint) => {
    const t = (totals[sym] ??= { out: "0", in: "0" });
    const cur = parseUnits(t[key], decimals);
    t[key] = formatFixed(cur + amount, decimals);
  };

  const authorizations = data.authorizations
    .filter((a) => a.chainId === input.chainId && inRange(a.createdAt))
    .map((a) => ({
      nonce: a.id,
      createdAt: new Date(a.createdAt).toISOString(),
      recipient: a.recipient,
      token: a.token.symbol,
      tokenAddress: a.token.address,
      amount: formatFixed(BigInt(a.amount), a.token.decimals),
      status: a.status,
      txHash: a.txHash ?? null,
      signature: a.signature,
    }));

  const settlements = input.activity
    .filter((i) => i.chainId === input.chainId && inRange(i.timestamp) && i.amount > 0n && i.token)
    .map((i) => {
      if (i.direction !== "self") bump(i.token!.symbol, i.direction === "out" ? "out" : "in", i.token!.decimals, i.amount);
      return {
        txHash: i.hash,
        time: new Date(i.timestamp).toISOString(),
        direction: i.direction,
        counterparty: i.counterparty,
        token: i.token?.symbol ?? null,
        amount: formatFixed(i.amount, i.token!.decimals),
      };
    });

  return {
    schema: "spectral.audit/1",
    holder: input.holder,
    chainId: input.chainId,
    credential: data.credential?.id ?? null,
    period: { from: new Date(input.from).toISOString(), to: new Date(input.to).toISOString() },
    generatedAt: new Date().toISOString(),
    authorizations,
    settlements,
    totals,
  };
}

/** Plain decimal string for a raw amount, without float rounding. */
function formatFixed(raw: bigint, decimals: number) {
  const neg = raw < 0n;
  const s = (neg ? -raw : raw).toString().padStart(decimals + 1, "0");
  const int = s.slice(0, s.length - decimals);
  const frac = decimals ? s.slice(-decimals).replace(/0+$/, "") : "";
  return `${neg ? "-" : ""}${int}${frac ? `.${frac}` : ""}`;
}

export type AuditVerification = {
  digestMatches: boolean;
  messageMatches: boolean;
  signatureValid: boolean;
  holder: Address;
  chainId: number;
};

/** Verifies a report file anyone hands you: content hash, message, and signer (EOA or ERC-1271). */
export async function verifyAuditFile(file: SignedAuditFile): Promise<AuditVerification> {
  const digest = reportDigest(file.report);
  const digestMatches = digest === file.digest;
  const messageMatches = reportMessage(file.report, digest) === file.message;
  let signatureValid = false;
  try {
    signatureValid = await publicClient(file.report.chainId).verifyMessage({
      address: file.report.holder,
      message: file.message,
      signature: file.signature,
    });
  } catch {
    signatureValid = false;
  }
  return { digestMatches, messageMatches, signatureValid, holder: file.report.holder, chainId: file.report.chainId };
}
