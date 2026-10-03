import bs58 from "bs58";
import { ed25519 } from "@noble/curves/ed25519.js";
import { sha256 } from "@noble/hashes/sha2.js";
import { bytesToHex, utf8ToBytes } from "@noble/hashes/utils.js";
import { chainMeta, isSolanaAddress, NATIVE } from "./chains";
import { RELAYER_URL } from "./env";
import { formatUnits, parseUnits } from "./format";
import type { ActivityItem } from "./data";
import { limitKey, type Authorization, type WalletData } from "./store";

/*
 * Spectral signs plain-text messages (Solana's signMessage, ed25519). Every
 * message names the app, the action and the network, so a signature for one
 * purpose can never be replayed as another. Signatures are verified here in
 * the browser against the holder's public key.
 */

const NETWORK_LABEL = "solana:mainnet";

const hex = (b: Uint8Array) => `0x${bytesToHex(b)}`;
const concat = (...parts: (Uint8Array | string)[]) => {
  const bytes = parts.map((p) => (typeof p === "string" ? utf8ToBytes(p) : p));
  const out = new Uint8Array(bytes.reduce((n, b) => n + b.length, 0));
  let o = 0;
  for (const b of bytes) {
    out.set(b, o);
    o += b.length;
  }
  return out;
};

/** Checks an ed25519 signature (base58) over a UTF-8 message against a Solana address. */
export function verifySolanaSignature(holder: string, message: string, signatureB58: string) {
  try {
    return ed25519.verify(bs58.decode(signatureB58), utf8ToBytes(message), bs58.decode(holder));
  } catch {
    return false;
  }
}

/* ============================================================ credential */

export const CREDENTIAL_STATEMENT =
  "Issue my Spectral spending credential for this address. This signature does not move funds and does not approve any spending.";

export const credentialMessage = (holder: string) =>
  ["Spectral credential", "", CREDENTIAL_STATEMENT, "", `Holder: ${holder}`, `Network: ${NETWORK_LABEL}`].join("\n");

/**
 * Derives the public credential from the holder's signature. The signature is
 * the secret: it is hashed immediately and never stored. ed25519 signatures are
 * deterministic, so the same wallet re-derives the same ID every time.
 */
export function deriveCredential(signatureB58: string, holder: string) {
  const secret = sha256(bs58.decode(signatureB58));
  const idBytes = sha256(concat(secret, "spectral.credential.id"));
  const commitment = sha256(concat(idBytes, holder, NETWORK_LABEL));
  return { id: hex(idBytes), commitment: hex(commitment) };
}

export const verifyCredentialSignature = (holder: string, signatureB58: string) =>
  verifySolanaSignature(holder, credentialMessage(holder), signatureB58);

/* ========================================================= authorization */

export const AUTH_TTL_MS = 15 * 60_000;

export const newNonce = () => hex(crypto.getRandomValues(new Uint8Array(32)));

export type PaymentDraft = {
  chainId: number;
  credential: string;
  recipient: string;
  token: { address: string; symbol: string; decimals: number };
  amount: bigint;
  nonce: string;
  deadline: number;
};

/** A fresh draft: new random nonce, valid for AUTH_TTL_MS from now. */
export function newDraft(input: Omit<PaymentDraft, "nonce" | "deadline">): PaymentDraft {
  return { ...input, nonce: newNonce(), deadline: Date.now() + AUTH_TTL_MS };
}

/** The exact text the wallet shows and signs for a payment authorization. */
export const paymentMessage = (d: PaymentDraft) =>
  [
    "Spectral payment authorization",
    "",
    `Pay: ${formatUnits(d.amount, d.token.decimals)} ${d.token.symbol}`,
    `Asset: ${d.token.address === NATIVE ? "SOL" : d.token.address}`,
    `To: ${d.recipient}`,
    `Credential: ${d.credential}`,
    `Nonce: ${d.nonce}`,
    `Valid until: ${new Date(d.deadline).toISOString()}`,
    `Network: ${NETWORK_LABEL}`,
  ].join("\n");

/** Parses a user-typed amount; returns null when it isn't a valid positive number for this token. */
export function parseAmount(input: string, decimals: number): bigint | null {
  const t = input.trim();
  if (!/^\d*\.?\d*$/.test(t) || t === "" || t === ".") return null;
  try {
    const v = parseUnits(t, decimals);
    return v > 0n ? v : null;
  } catch {
    return null;
  }
}

const COUNTS_TOWARD_LIMIT = new Set<Authorization["status"]>(["signed", "submitted", "settled", "relayed"]);

/** Amount already authorized for a token in the trailing 24 hours. */
export function spentToday(data: WalletData, chainId: number, token: string, now = Date.now()): bigint {
  let sum = 0n;
  for (const a of data.authorizations) {
    if (a.chainId !== chainId || a.token.address !== token) continue;
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
  input: { chainId: number; owner: string; recipient: string; token: PaymentDraft["token"] | null; amount: bigint | null; balance: bigint | null },
): PolicyIssue[] {
  const issues: PolicyIssue[] = [];
  if (!data.credential) issues.push({ level: "block", text: "Issue a credential before authorizing payments." });
  else if (data.credential.chainId !== input.chainId)
    issues.push({ level: "block", text: "Your credential was issued for another network. Issue one for Solana." });

  const r = input.recipient.trim();
  if (!r) issues.push({ level: "block", text: "Enter a recipient address." });
  else if (!isSolanaAddress(r)) issues.push({ level: "block", text: "The recipient is not a valid Solana address." });
  else {
    if (r === input.owner) issues.push({ level: "block", text: "You can't pay your own address." });
    const known = data.policy.merchants.some((m) => m.address === r);
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

export const isNative = (token: string) => token === NATIVE;

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
 * Hands a signed authorization to the relayer, which pays the fee and submits
 * it. Expected response: `{ id: string, txHash?: string }` (a Solana signature).
 */
export async function submitToRelayer(a: Authorization): Promise<{ id: string; txHash?: string }> {
  const body = {
    network: NETWORK_LABEL,
    authorization: {
      credential: a.credential,
      recipient: a.recipient,
      mint: a.token.address,
      amount: a.amount,
      nonce: a.id,
      deadline: Math.floor(a.deadline / 1000),
    },
    message: a.message,
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
  return { id: j.id ?? "accepted", txHash: j.txHash };
}

/* ========================================================== audit reports */

export type AuditReport = {
  schema: "spectral.audit/2";
  holder: string;
  network: string;
  credential: string | null;
  period: { from: string; to: string };
  generatedAt: string;
  authorizations: {
    nonce: string;
    createdAt: string;
    recipient: string;
    token: string;
    mint: string;
    amount: string;
    status: string;
    txHash: string | null;
    signature: string;
  }[];
  settlements: {
    txHash: string;
    time: string;
    direction: string;
    counterparty: string | null;
    token: string | null;
    amount: string;
  }[];
  totals: Record<string, { out: string; in: string }>;
};

export type SignedAuditFile = { report: AuditReport; digest: string; message: string; signature: string };

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

export const reportDigest = (r: AuditReport) => hex(sha256(utf8ToBytes(canonical(r))));

export const reportMessage = (r: AuditReport, digest: string) =>
  [
    "Spectral audit report",
    `Holder: ${r.holder}`,
    `Network: ${r.network}`,
    `Period: ${r.period.from} to ${r.period.to}`,
    `Entries: ${r.authorizations.length + r.settlements.length}`,
    `Digest: ${digest}`,
  ].join("\n");

export function buildAuditReport(
  data: WalletData,
  input: { holder: string; chainId: number; from: number; to: number; activity: ActivityItem[] },
): AuditReport {
  const inRange = (t: number) => t >= input.from && t <= input.to;
  const totals: AuditReport["totals"] = {};
  const bump = (sym: string, key: "out" | "in", decimals: number, amount: bigint) => {
    const t = (totals[sym] ??= { out: "0", in: "0" });
    t[key] = formatUnits(parseUnits(t[key], decimals) + amount, decimals);
  };

  const authorizations = data.authorizations
    .filter((a) => a.chainId === input.chainId && inRange(a.createdAt))
    .map((a) => ({
      nonce: a.id,
      createdAt: new Date(a.createdAt).toISOString(),
      recipient: a.recipient,
      token: a.token.symbol,
      mint: a.token.address,
      amount: formatUnits(BigInt(a.amount), a.token.decimals),
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
        amount: formatUnits(i.amount, i.token!.decimals),
      };
    });

  return {
    schema: "spectral.audit/2",
    holder: input.holder,
    network: `${chainMeta().name} (${NETWORK_LABEL})`,
    credential: data.credential?.id ?? null,
    period: { from: new Date(input.from).toISOString(), to: new Date(input.to).toISOString() },
    generatedAt: new Date().toISOString(),
    authorizations,
    settlements,
    totals,
  };
}

export type AuditVerification = {
  digestMatches: boolean;
  messageMatches: boolean;
  signatureValid: boolean;
  holder: string;
  network: string;
};

/** Verifies a report file anyone hands you: content hash, message, and the holder's ed25519 signature. */
export function verifyAuditFile(file: SignedAuditFile): AuditVerification {
  const digest = reportDigest(file.report);
  return {
    digestMatches: digest === file.digest,
    messageMatches: reportMessage(file.report, digest) === file.message,
    signatureValid: verifySolanaSignature(file.report.holder, file.message, file.signature),
    holder: file.report.holder,
    network: file.report.network,
  };
}
