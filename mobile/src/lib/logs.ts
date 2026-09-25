// Mirrors src/dashboard/lib/logs.ts in the web app. Keep the two in step.
import { erc20Abi, getAddress, parseAbiItem, type Address } from "viem";
import { publicClient } from "./clients";

/**
 * RPC fallback for chains whose explorer can't be reached.
 *
 * Reads ERC-20 Transfer logs where the wallet is sender or receiver, walking
 * backwards from the head in large block windows. Measured on Robinhood Chain
 * mainnet: a wallet-filtered 20M-block window answers in ~0.3s, while the node
 * rejects any query matching more than 10,000 logs or taking too long. So a
 * failing window is halved and retried, down to a floor, before giving up.
 */

const TRANSFER = parseAbiItem("event Transfer(address indexed from, address indexed to, uint256 value)");

export type RawTransfer = {
  token: Address;
  from: Address;
  to: Address;
  value: bigint;
  txHash: `0x${string}`;
  blockNumber: bigint;
  logIndex: number;
};

const START_WINDOW = 20_000_000n;
const MIN_WINDOW = 50_000n;

async function logsInWindow(chainId: number, owner: Address, fromBlock: bigint, toBlock: bigint) {
  const client = publicClient(chainId);
  // Two filtered queries (as sender, as receiver) instead of one wide one.
  const [out, inn] = await Promise.all([
    client.getLogs({ event: TRANSFER, args: { from: owner }, fromBlock, toBlock, strict: true }),
    client.getLogs({ event: TRANSFER, args: { to: owner }, fromBlock, toBlock, strict: true }),
  ]);
  return [...out, ...inn];
}

/**
 * Collects up to `limit` of the most recent transfers touching `owner`.
 * Returns what it found plus how far back it managed to look.
 */
export async function scanTransfers(
  chainId: number,
  owner: Address,
  opts: { limit?: number; signal?: AbortSignal; budgetMs?: number } = {},
): Promise<{ transfers: RawTransfer[]; scannedFrom: bigint; complete: boolean }> {
  const limit = opts.limit ?? 60;
  // Hard stop so a very busy wallet returns partial history instead of hanging the page.
  const deadline = Date.now() + (opts.budgetMs ?? 12_000);
  const client = publicClient(chainId);
  const head = await client.getBlockNumber();

  const found = new Map<string, RawTransfer>();
  let to = head;
  let window = START_WINDOW;

  while (to > 0n && found.size < limit) {
    if (opts.signal?.aborted) throw Object.assign(new Error("Aborted"), { name: "AbortError" });
    if (Date.now() > deadline) break;
    const from = to > window ? to - window + 1n : 0n;
    try {
      const logs = await logsInWindow(chainId, owner, from, to);
      for (const l of logs) {
        const key = `${l.transactionHash}:${l.logIndex}`;
        found.set(key, {
          token: getAddress(l.address),
          from: getAddress(l.args.from),
          to: getAddress(l.args.to),
          value: l.args.value,
          txHash: l.transactionHash,
          blockNumber: l.blockNumber,
          logIndex: l.logIndex,
        });
      }
      to = from - 1n;
    } catch {
      if (window <= MIN_WINDOW) {
        // A very active wallet at this depth: stop here and report partial history.
        return { transfers: sortNewest([...found.values()]).slice(0, limit), scannedFrom: to + 1n, complete: false };
      }
      window /= 4n;
    }
  }

  return {
    transfers: sortNewest([...found.values()]).slice(0, limit),
    scannedFrom: to < 0n ? 0n : to + 1n,
    complete: to <= 0n || found.size >= limit,
  };
}

type ScanResult = Awaited<ReturnType<typeof scanTransfers>>;
const scanCache = new Map<string, { at: number; p: Promise<ScanResult> }>();

/**
 * Portfolio discovery and activity both need the same scan; share one per
 * wallet for a minute instead of hitting the RPC twice.
 */
export function scanTransfersShared(chainId: number, owner: Address): Promise<ScanResult> {
  const k = `${chainId}:${owner.toLowerCase()}`;
  const hit = scanCache.get(k);
  if (hit && Date.now() - hit.at < 60_000) return hit.p;
  const p = scanTransfers(chainId, owner, { limit: 400 });
  p.catch(() => scanCache.delete(k));
  scanCache.set(k, { at: Date.now(), p });
  return p;
}

const sortNewest = (xs: RawTransfer[]) =>
  xs.sort((a, b) => (a.blockNumber === b.blockNumber ? b.logIndex - a.logIndex : a.blockNumber > b.blockNumber ? -1 : 1));

export type TokenMeta = { address: Address; symbol: string; name: string; decimals: number };

/** Reads symbol/name/decimals for many tokens in one multicall. Skips non-ERC-20s. */
export async function readTokenMeta(chainId: number, tokens: Address[]): Promise<TokenMeta[]> {
  if (!tokens.length) return [];
  const client = publicClient(chainId);
  const calls = tokens.flatMap((address) => [
    { address, abi: erc20Abi, functionName: "symbol" } as const,
    { address, abi: erc20Abi, functionName: "name" } as const,
    { address, abi: erc20Abi, functionName: "decimals" } as const,
  ]);
  const res = await client.multicall({ contracts: calls, allowFailure: true });
  const out: TokenMeta[] = [];
  tokens.forEach((address, i) => {
    const [s, n, d] = res.slice(i * 3, i * 3 + 3);
    if (d.status !== "success") return;
    out.push({
      address,
      symbol: s.status === "success" ? String(s.result) : "?",
      name: n.status === "success" ? String(n.result) : "Unknown token",
      decimals: Number(d.result),
    });
  });
  return out;
}

/** balanceOf for many tokens in one multicall. */
export async function readBalances(chainId: number, owner: Address, tokens: Address[]) {
  if (!tokens.length) return new Map<Address, bigint>();
  const client = publicClient(chainId);
  const res = await client.multicall({
    contracts: tokens.map((address) => ({ address, abi: erc20Abi, functionName: "balanceOf", args: [owner] }) as const),
    allowFailure: true,
  });
  const out = new Map<Address, bigint>();
  tokens.forEach((t, i) => {
    const r = res[i];
    if (r.status === "success") out.set(t, r.result as bigint);
  });
  return out;
}

/**
 * Block timestamps for a set of block numbers.
 * Fetched in small sequential chunks: viem folds concurrent calls into one
 * JSON-RPC batch, and the Robinhood Chain RPC rejects large batches outright
 * (every call in the batch fails), so 60 blocks at once returns nothing.
 */
export async function readBlockTimes(chainId: number, blocks: bigint[]) {
  const client = publicClient(chainId);
  const unique = [...new Set(blocks)];
  const out = new Map<bigint, number>();
  const CHUNK = 8;
  for (let i = 0; i < unique.length; i += CHUNK) {
    const slice = unique.slice(i, i + CHUNK);
    const res = await Promise.all(slice.map((b) => client.getBlock({ blockNumber: b }).catch(() => null)));
    slice.forEach((b, j) => {
      const blk = res[j];
      if (blk) out.set(b, Number(blk.timestamp) * 1000);
    });
  }
  return out;
}
