import { getAddress, type Address } from "viem";
import { chainMeta } from "./chains";

/**
 * Minimal Blockscout v2 client. Field names match what the live explorers
 * return (checked against explorer.testnet.chain.robinhood.com). Every call
 * throws on a non-OK response so callers can fall back to the RPC.
 */

export class ExplorerUnavailable extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ExplorerUnavailable";
  }
}

async function get<T>(chainId: number, path: string, signal?: AbortSignal): Promise<T> {
  const url = chainMeta(chainId).explorerApi + path;
  let res: Response;
  try {
    res = await fetch(url, { headers: { accept: "application/json" }, signal });
  } catch (err) {
    if ((err as Error).name === "AbortError") throw err;
    throw new ExplorerUnavailable(`Explorer unreachable (${(err as Error).message})`);
  }
  if (!res.ok) throw new ExplorerUnavailable(`Explorer returned ${res.status}`);
  const text = await res.text();
  if (!text || text.trimStart().startsWith("<")) throw new ExplorerUnavailable("Explorer returned a non-JSON page");
  return JSON.parse(text) as T;
}

type BsToken = {
  address_hash?: string;
  address?: string;
  symbol: string | null;
  name: string | null;
  decimals: string | null;
  exchange_rate: string | null;
  volume_24h?: string | null;
  icon_url?: string | null;
  type: string;
};

const tokenAddress = (t: BsToken) => getAddress((t.address_hash ?? t.address) as string);

export type ExplorerHolding = {
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  raw: bigint;
  usdRate: number | null;
  volume24h: number | null;
  icon: string | null;
};

export async function fetchTokenBalances(chainId: number, owner: Address, signal?: AbortSignal) {
  const rows = await get<{ token: BsToken; value: string }[]>(chainId, `/addresses/${owner}/token-balances`, signal);
  const out: ExplorerHolding[] = [];
  for (const r of rows) {
    if (r.token.type !== "ERC-20" || r.token.decimals == null) continue;
    out.push({
      address: tokenAddress(r.token),
      symbol: r.token.symbol ?? "?",
      name: r.token.name ?? r.token.symbol ?? "Unknown token",
      decimals: Number(r.token.decimals),
      raw: BigInt(r.value),
      usdRate: r.token.exchange_rate ? Number(r.token.exchange_rate) : null,
      volume24h: r.token.volume_24h ? Number(r.token.volume_24h) : null,
      icon: r.token.icon_url ?? null,
    });
  }
  return out;
}

export type ExplorerCounters = { txCount: number; tokenTransferCount: number };

export async function fetchCounters(chainId: number, owner: Address, signal?: AbortSignal): Promise<ExplorerCounters> {
  const c = await get<{ transactions_count: string; token_transfers_count: string }>(
    chainId,
    `/addresses/${owner}/counters`,
    signal,
  );
  return { txCount: Number(c.transactions_count), tokenTransferCount: Number(c.token_transfers_count) };
}

export async function fetchAddressInfo(chainId: number, owner: Address, signal?: AbortSignal) {
  const a = await get<{ ens_domain_name: string | null; exchange_rate: string | null }>(
    chainId,
    `/addresses/${owner}`,
    signal,
  );
  return { ens: a.ens_domain_name, nativeUsdRate: a.exchange_rate ? Number(a.exchange_rate) : null };
}

type BsTx = {
  hash: string;
  from: { hash: string };
  to: { hash: string } | null;
  value: string;
  method: string | null;
  timestamp: string;
  status: string | null;
  result: string;
  fee: { value: string } | null;
  block_number?: number;
};

type BsTransfer = {
  transaction_hash: string;
  from: { hash: string };
  to: { hash: string };
  total: { decimals: string | null; value: string };
  token: BsToken;
  timestamp: string;
  log_index?: number;
  block_number?: number;
};

export type Page<T> = { items: T[]; next: Record<string, unknown> | null };

/** Builds a query string; pagination params come back from Blockscout as-is. */
const qs = (params: Record<string, unknown> | null | undefined, base: Record<string, string> = {}) => {
  const q = new URLSearchParams(base);
  if (params) for (const [k, v] of Object.entries(params)) q.set(k, String(v));
  const s = q.toString();
  return s ? `?${s}` : "";
};

export async function fetchTransactions(
  chainId: number,
  owner: Address,
  next: Record<string, unknown> | null,
  signal?: AbortSignal,
): Promise<Page<BsTx>> {
  const d = await get<{ items: BsTx[]; next_page_params: Record<string, unknown> | null }>(
    chainId,
    `/addresses/${owner}/transactions${qs(next)}`,
    signal,
  );
  return { items: d.items, next: d.next_page_params };
}

export async function fetchTokenTransfers(
  chainId: number,
  owner: Address,
  next: Record<string, unknown> | null,
  signal?: AbortSignal,
): Promise<Page<BsTransfer>> {
  const d = await get<{ items: BsTransfer[]; next_page_params: Record<string, unknown> | null }>(
    chainId,
    `/addresses/${owner}/token-transfers${qs(next, { type: "ERC-20" })}`,
    signal,
  );
  return { items: d.items, next: d.next_page_params };
}

export type { BsTx, BsTransfer, BsToken };
export { tokenAddress };
