import { useSyncExternalStore } from "react";
import type { Address, Hex } from "viem";

/**
 * Everything Spectral keeps on this device, per wallet address.
 *
 * Only public material is stored: the credential ID and commitment (never the
 * signature they were derived from), spending policy, the authorizations the
 * user signed, and the audit reports they generated. Versioned so a future
 * schema change can migrate instead of breaking.
 */

export const SCHEMA_VERSION = 1;

export type Credential = {
  id: Hex;
  commitment: Hex;
  chainId: number;
  issuedAt: number;
  /** How the wallet was accessed when the credential was issued. */
  method: string;
  /** false when the wallet signs non-deterministically (smart accounts, some embedded wallets). */
  deterministic: boolean | null;
  /** Name printed on the Spectral card. Older credentials may not have one yet. */
  holderName?: string;
};

export type Merchant = { address: Address; label: string; addedAt: number };

export type Policy = {
  /** Daily cap per token, keyed `${chainId}:${tokenAddress}`, as a human decimal string. */
  dailyLimits: Record<string, string>;
  allowlistOnly: boolean;
  merchants: Merchant[];
};

export type AuthStatus = "signed" | "submitted" | "settled" | "relayed" | "failed" | "expired";

export type Authorization = {
  id: Hex; // the nonce
  chainId: number;
  credential: Hex;
  token: { address: Address; symbol: string; decimals: number };
  recipient: Address;
  amount: string; // raw units, as a string so it survives JSON
  deadline: number; // ms
  createdAt: number;
  memo?: string;
  signature: Hex;
  status: AuthStatus;
  settlement?: "relayer" | "wallet";
  txHash?: Hex;
  relayerRef?: string;
  error?: string;
};

export type AuditReportRecord = {
  id: string;
  chainId: number;
  from: number;
  to: number;
  createdAt: number;
  entries: number;
  digest: Hex;
  signature: Hex;
  file: string; // the full signed JSON, so it can be downloaded again
};

export type WalletData = {
  version: number;
  credential: Credential | null;
  policy: Policy;
  authorizations: Authorization[];
  reports: AuditReportRecord[];
};

const empty = (): WalletData => ({
  version: SCHEMA_VERSION,
  credential: null,
  policy: { dailyLimits: {}, allowlistOnly: false, merchants: [] },
  authorizations: [],
  reports: [],
});

const keyFor = (address: string) => `spectral:v${SCHEMA_VERSION}:${address.toLowerCase()}`;

/* ---- tiny external store with an in-memory cache (localStorage reads are sync and slow) ---- */

const cache = new Map<string, WalletData>();
const listeners = new Set<() => void>();
const EMPTY = empty();

function read(address: string): WalletData {
  const k = keyFor(address);
  const hit = cache.get(k);
  if (hit) return hit;
  let data = empty();
  try {
    const raw = localStorage.getItem(k);
    if (raw) {
      const parsed = JSON.parse(raw) as WalletData;
      if (parsed.version === SCHEMA_VERSION) data = { ...empty(), ...parsed, policy: { ...empty().policy, ...parsed.policy } };
    }
  } catch {
    // unreadable storage: start clean rather than crash the dashboard
  }
  cache.set(k, data);
  return data;
}

function write(address: string, data: WalletData) {
  const k = keyFor(address);
  cache.set(k, data);
  try {
    localStorage.setItem(k, JSON.stringify(data));
  } catch {
    // storage full or blocked: keep the in-memory copy for this session
  }
  listeners.forEach((l) => l());
}

export function updateWallet(address: string, fn: (d: WalletData) => WalletData) {
  write(address, fn(read(address)));
}

export function replaceWallet(address: string, data: WalletData) {
  write(address, data);
}

export function clearWallet(address: string) {
  const k = keyFor(address);
  cache.delete(k);
  try {
    localStorage.removeItem(k);
  } catch {
    /* ignore */
  }
  listeners.forEach((l) => l());
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  const onStorage = (e: StorageEvent) => {
    if (e.key?.startsWith("spectral:")) {
      cache.clear();
      cb();
    }
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(cb);
    window.removeEventListener("storage", onStorage);
  };
}

export function useWalletData(address: string | undefined): WalletData {
  return useSyncExternalStore(
    subscribe,
    () => (address ? read(address) : EMPTY),
    () => EMPTY,
  );
}

/* ---- typed mutations ---- */

export const setCredential = (address: string, credential: Credential | null) =>
  updateWallet(address, (d) => ({ ...d, credential }));

export const setPolicy = (address: string, fn: (p: Policy) => Policy) =>
  updateWallet(address, (d) => ({ ...d, policy: fn(d.policy) }));

export const addAuthorization = (address: string, a: Authorization) =>
  updateWallet(address, (d) => ({ ...d, authorizations: [a, ...d.authorizations] }));

export const patchAuthorization = (address: string, id: Hex, patch: Partial<Authorization>) =>
  updateWallet(address, (d) => ({
    ...d,
    authorizations: d.authorizations.map((a) => (a.id === id ? { ...a, ...patch } : a)),
  }));

export const addReport = (address: string, r: AuditReportRecord) =>
  updateWallet(address, (d) => ({ ...d, reports: [r, ...d.reports] }));

export const removeReport = (address: string, id: string) =>
  updateWallet(address, (d) => ({ ...d, reports: d.reports.filter((r) => r.id !== id) }));

export const limitKey = (chainId: number, token: Address) => `${chainId}:${token.toLowerCase()}`;

/** Parses an exported backup, checking it belongs to this schema. */
export function parseBackup(text: string): WalletData {
  const parsed = JSON.parse(text) as Partial<WalletData> & { holder?: string };
  if (parsed.version !== SCHEMA_VERSION) throw new Error(`Unsupported backup version ${String(parsed.version)}`);
  return { ...empty(), ...parsed, policy: { ...empty().policy, ...(parsed.policy ?? {}) } } as WalletData;
}
