import { useEffect, useSyncExternalStore } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Address, Hex } from "viem";

/**
 * Everything CassaFi keeps on this phone, per wallet address. Same schema and
 * key format as the web app (src/dashboard/lib/store.ts), so a backup moves
 * between them unchanged.
 *
 * Only public material is stored: the credential ID and commitment (never the
 * signature they were derived from), spending policy, and the authorizations
 * the user signed. AsyncStorage is asynchronous, so each address is loaded
 * once into memory and every read after that is synchronous.
 */

export const SCHEMA_VERSION = 1;

export type Credential = {
  id: Hex;
  commitment: Hex;
  chainId: number;
  issuedAt: number;
  method: string;
  deterministic: boolean | null;
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
  id: Hex;
  chainId: number;
  credential: Hex;
  token: { address: Address; symbol: string; decimals: number };
  recipient: Address;
  amount: string;
  deadline: number;
  createdAt: number;
  memo?: string;
  signature: Hex;
  status: AuthStatus;
  settlement?: "relayer" | "wallet";
  txHash?: Hex;
  relayerRef?: string;
  error?: string;
};

export type WalletData = {
  version: number;
  credential: Credential | null;
  policy: Policy;
  authorizations: Authorization[];
  // Present in web backups; the phone keeps them untouched.
  reports: unknown[];
};

const empty = (): WalletData => ({
  version: SCHEMA_VERSION,
  credential: null,
  policy: { dailyLimits: {}, allowlistOnly: false, merchants: [] },
  authorizations: [],
  reports: [],
});

const keyFor = (address: string) => `cassafi:v${SCHEMA_VERSION}:${address.toLowerCase()}`;

const cache = new Map<string, WalletData>();
const loading = new Set<string>();
const listeners = new Set<() => void>();
const EMPTY = empty();
const notify = () => listeners.forEach((l) => l());

async function load(address: string) {
  const k = keyFor(address);
  if (cache.has(k) || loading.has(k)) return;
  loading.add(k);
  let data = empty();
  try {
    const raw = await AsyncStorage.getItem(k);
    if (raw) {
      const parsed = JSON.parse(raw) as WalletData;
      if (parsed.version === SCHEMA_VERSION) data = { ...empty(), ...parsed, policy: { ...empty().policy, ...parsed.policy } };
    }
  } catch {
    // unreadable storage: start clean rather than crash the app
  }
  // A write that landed while we were reading wins.
  if (!cache.has(k)) cache.set(k, data);
  loading.delete(k);
  notify();
}

function write(address: string, data: WalletData) {
  const k = keyFor(address);
  cache.set(k, data);
  notify();
  AsyncStorage.setItem(k, JSON.stringify(data)).catch(() => {
    // storage full or blocked: keep the in-memory copy for this session
  });
}

const read = (address: string) => cache.get(keyFor(address)) ?? EMPTY;

export function updateWallet(address: string, fn: (d: WalletData) => WalletData) {
  write(address, fn(read(address)));
}

export function clearWallet(address: string) {
  const k = keyFor(address);
  cache.set(k, empty());
  notify();
  AsyncStorage.removeItem(k).catch(() => {});
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

/** The address's data, and whether it has been read from storage yet. */
export function useWalletData(address: string | undefined): { data: WalletData; ready: boolean } {
  useEffect(() => {
    if (address) void load(address);
  }, [address]);
  const data = useSyncExternalStore(
    subscribe,
    () => (address ? read(address) : EMPTY),
    () => EMPTY,
  );
  const ready = useSyncExternalStore(
    subscribe,
    () => !address || cache.has(keyFor(address)),
    () => false,
  );
  return { data, ready };
}

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

export const limitKey = (chainId: number, token: Address) => `${chainId}:${token.toLowerCase()}`;
