import { getAddress, type Address } from "viem";
import { chainMeta, NATIVE } from "./chains";
import { publicClient } from "./clients";
import {
  ExplorerUnavailable,
  fetchAddressInfo,
  fetchCounters,
  fetchTokenBalances,
  fetchTokenTransfers,
  fetchTransactions,
  tokenAddress,
  type BsTransfer,
  type BsTx,
} from "./explorer";
import { readBalances, readBlockTimes, readTokenMeta, scanTransfersShared } from "./logs";
import { lower } from "./format";

/* =========================================================== prices */

let ethUsdCache: { at: number; value: number | null } | null = null;

/** ETH/USD from Ethereum's Blockscout stats (the explorer's own market feed). */
export async function ethUsd(): Promise<number | null> {
  if (ethUsdCache && Date.now() - ethUsdCache.at < 5 * 60_000) return ethUsdCache.value;
  try {
    const r = await fetch("https://eth.blockscout.com/api/v2/stats", { headers: { accept: "application/json" } });
    const j = (await r.json()) as { coin_price: string | null };
    const value = j.coin_price ? Number(j.coin_price) : null;
    ethUsdCache = { at: Date.now(), value };
    return value;
  } catch {
    return ethUsdCache?.value ?? null;
  }
}

/* =========================================================== portfolio */

export type Holding = {
  token: Address; // NATIVE for ETH
  /** Market value if we had a price but it was not counted (illiquid, see liquidUsd). */
  illiquidUsd?: number;
  symbol: string;
  name: string;
  decimals: number;
  raw: bigint;
  usd: number | null;
  icon: string | null;
  native: boolean;
};

export type Portfolio = {
  chainId: number;
  holdings: Holding[];
  /** Sum of holdings that have a price. */
  totalUsd: number;
  unpriced: number;
  source: "explorer" | "rpc";
};

const toNum = (raw: bigint, decimals: number) => Number(raw) / 10 ** decimals;

/**
 * Explorer prices are real market rates, but wallets collect unsolicited
 * airdrops whose "value" could never be sold (e.g. a $378k position in a token
 * trading $453 a day). A position is counted only when one day of trading
 * volume could absorb it.
 */
function liquidUsd(amount: number, rate: number | null, volume24h: number | null) {
  if (rate == null) return { usd: null, illiquid: undefined };
  const value = amount * rate;
  if (volume24h != null && volume24h >= value) return { usd: value, illiquid: undefined };
  return { usd: null, illiquid: value };
}

export async function loadPortfolio(chainId: number, owner: Address, signal?: AbortSignal): Promise<Portfolio> {
  const meta = chainMeta(chainId);
  const client = publicClient(chainId);

  // Native balance and price are independent of token discovery: start them now.
  const nativeP = client.getBalance({ address: owner });
  const priceP = meta.testnet ? Promise.resolve(null) : ethUsd();

  let tokens: Holding[] = [];
  let source: Portfolio["source"] = "explorer";

  try {
    const rows = await fetchTokenBalances(chainId, owner, signal);
    tokens = rows
      .filter((r) => r.raw > 0n)
      .map((r) => {
        const { usd, illiquid } = liquidUsd(toNum(r.raw, r.decimals), r.usdRate, r.volume24h);
        return {
          token: r.address,
          symbol: r.symbol,
          name: r.name,
          decimals: r.decimals,
          raw: r.raw,
          usd,
          illiquidUsd: illiquid,
          icon: r.icon,
          native: false,
        };
      });
  } catch (err) {
    if (!(err instanceof ExplorerUnavailable)) throw err;
    source = "rpc";
    // Discover every token the wallet has ever received, then read live balances.
    const { transfers } = await scanTransfersShared(chainId, owner);
    const seen = [...new Set(transfers.filter((t) => lower(t.to) === lower(owner)).map((t) => t.token))];
    const [balances, metas] = await Promise.all([readBalances(chainId, owner, seen), readTokenMeta(chainId, seen)]);
    tokens = metas
      .map((m) => ({ ...m, raw: balances.get(m.address) ?? 0n }))
      .filter((m) => m.raw > 0n)
      .map((m) => ({ token: m.address, symbol: m.symbol, name: m.name, decimals: m.decimals, raw: m.raw, usd: null, icon: null, native: false }));
  }

  // Well-known tokens are always checked, with a USD peg where it is real.
  if (meta.knownTokens.length) {
    const missing = meta.knownTokens.filter((k) => !tokens.some((t) => lower(t.token) === lower(k.address)));
    const bal = await readBalances(chainId, owner, missing.map((k) => k.address));
    for (const k of missing) {
      const raw = bal.get(k.address) ?? 0n;
      if (raw > 0n) tokens.push({ token: k.address, symbol: k.symbol, name: k.symbol, decimals: k.decimals, raw, usd: null, icon: null, native: false });
    }
    for (const t of tokens) {
      const k = meta.knownTokens.find((x) => lower(x.address) === lower(t.token));
      if (k?.usdPegged) {
        t.usd = toNum(t.raw, t.decimals);
        t.illiquidUsd = undefined;
      }
    }
  }

  const [nativeRaw, price] = await Promise.all([nativeP, priceP]);
  const native: Holding = {
    token: NATIVE,
    symbol: "ETH",
    name: meta.testnet ? `${meta.short} ETH (test)` : "Ether",
    decimals: 18,
    raw: nativeRaw,
    usd: price != null ? toNum(nativeRaw, 18) * price : null,
    icon: null,
    native: true,
  };

  // Priced value first; among unpriced assets native ETH leads, so an airdropped
  // token with an odd symbol never becomes the default choice.
  const holdings = [native, ...tokens].sort(
    (a, b) => (b.usd ?? -1) - (a.usd ?? -1) || Number(b.native) - Number(a.native) || a.symbol.localeCompare(b.symbol),
  );
  let totalUsd = 0;
  let unpriced = 0;
  for (const h of holdings) {
    if (h.raw === 0n) continue;
    if (h.usd == null) unpriced++;
    else totalUsd += h.usd;
  }
  return { chainId, holdings, totalUsd, unpriced, source };
}

/* =========================================================== activity */

export type ActivityItem = {
  id: string;
  chainId: number;
  hash: `0x${string}`;
  kind: "native" | "token" | "call";
  direction: "in" | "out" | "self";
  counterparty: Address | null;
  token: { address: Address; symbol: string; decimals: number } | null;
  amount: bigint;
  timestamp: number;
  status: "success" | "failed" | "pending";
  method: string | null;
};

/**
 * Two explorer feeds (native txs, token transfers) paginate independently, so
 * each page can reach a different depth in time. Items older than the
 * shallower feed's oldest item are held in `buffer` until the next page, which
 * keeps the merged list strictly newest-first across pages.
 */
export type ActivityCursor = {
  tx: Record<string, unknown> | null | "done";
  tt: Record<string, unknown> | null | "done";
  buffer: ActivityItem[];
};

export type ActivityPage = {
  items: ActivityItem[];
  cursor: ActivityCursor | null;
  source: "explorer" | "rpc";
  /** RPC mode: how far back the scan reached, and whether it hit genesis. */
  coverage?: { fromBlock: bigint; complete: boolean };
};

const dir = (owner: Address, from: string, to: string | null): ActivityItem["direction"] => {
  const o = lower(owner);
  if (lower(from) === o && to && lower(to) === o) return "self";
  return lower(from) === o ? "out" : "in";
};

function mapTx(chainId: number, owner: Address, t: BsTx): ActivityItem {
  const value = BigInt(t.value ?? "0");
  const d = dir(owner, t.from.hash, t.to?.hash ?? null);
  const other = d === "out" ? t.to?.hash : t.from.hash;
  return {
    id: `tx:${t.hash}`,
    chainId,
    hash: t.hash as `0x${string}`,
    kind: value > 0n ? "native" : "call",
    direction: d,
    counterparty: other ? getAddress(other) : null,
    token: value > 0n ? { address: NATIVE, symbol: "ETH", decimals: 18 } : null,
    amount: value,
    timestamp: Date.parse(t.timestamp),
    status: t.result === "success" || t.status === "ok" ? "success" : t.result === "pending" ? "pending" : "failed",
    method: t.method,
  };
}

function mapTransfer(chainId: number, owner: Address, t: BsTransfer): ActivityItem {
  const d = dir(owner, t.from.hash, t.to.hash);
  const other = d === "out" ? t.to.hash : t.from.hash;
  const decimals = Number(t.total.decimals ?? t.token.decimals ?? 18);
  return {
    id: `tt:${t.transaction_hash}:${t.log_index ?? `${t.from.hash}${t.to.hash}${t.total.value}`}`,
    chainId,
    hash: t.transaction_hash as `0x${string}`,
    kind: "token",
    direction: d,
    counterparty: getAddress(other),
    token: { address: tokenAddress(t.token), symbol: t.token.symbol ?? "?", decimals },
    amount: BigInt(t.total.value ?? "0"),
    timestamp: Date.parse(t.timestamp),
    status: "success",
    method: null,
  };
}

/**
 * One page of history. Explorer mode merges native transactions and token
 * transfers (two independently paginated feeds) newest-first; a plain contract
 * call is dropped when a token transfer from the same transaction explains it.
 */
export async function loadActivityPage(
  chainId: number,
  owner: Address,
  cursor: ActivityCursor | null,
  signal?: AbortSignal,
): Promise<ActivityPage> {
  const c: ActivityCursor = cursor ?? { tx: null, tt: null, buffer: [] };
  try {
    const [txs, tts] = await Promise.all([
      c.tx === "done" ? null : fetchTransactions(chainId, owner, c.tx, signal),
      c.tt === "done" ? null : fetchTokenTransfers(chainId, owner, c.tt, signal),
    ]);
    const transfers = (tts?.items ?? []).map((t) => mapTransfer(chainId, owner, t));
    const txItems = (txs?.items ?? []).map((t) => mapTx(chainId, owner, t));
    const next = {
      tx: c.tx === "done" || !txs?.next ? ("done" as const) : txs.next,
      tt: c.tt === "done" || !tts?.next ? ("done" as const) : tts.next,
    };

    // A feed with more pages only guarantees completeness down to its oldest item.
    let boundary = -Infinity;
    const oldest = (xs: ActivityItem[]) => xs.reduce((m, x) => Math.min(m, x.timestamp), Infinity);
    if (next.tx !== "done" && txItems.length) boundary = Math.max(boundary, oldest(txItems));
    if (next.tt !== "done" && transfers.length) boundary = Math.max(boundary, oldest(transfers));

    const tokenTxHashes = new Set([...c.buffer, ...transfers].filter((i) => i.kind === "token").map((i) => i.hash));
    const all = [...c.buffer, ...txItems, ...transfers]
      .filter((i) => !(i.kind === "call" && tokenTxHashes.has(i.hash)))
      .sort((x, y) => y.timestamp - x.timestamp);

    const items = all.filter((i) => i.timestamp >= boundary);
    const buffer = all.filter((i) => i.timestamp < boundary);
    const more = next.tx !== "done" || next.tt !== "done" || buffer.length > 0;
    return { items, cursor: more ? { ...next, buffer } : null, source: "explorer" };
  } catch (err) {
    if (!(err instanceof ExplorerUnavailable)) throw err;
  }

  // RPC fallback: ERC-20 transfers from logs (native ETH transfers leave no log).
  if (cursor) return { items: [], cursor: null, source: "rpc" };
  const scan = await scanTransfersShared(chainId, owner);
  const transfers = scan.transfers.slice(0, 60);
  const { scannedFrom, complete } = scan;
  const tokens = [...new Set(transfers.map((t) => t.token))];
  // Sequential on purpose: running both at once overflows the RPC's batch limit.
  const metas = await readTokenMeta(chainId, tokens);
  const times = await readBlockTimes(chainId, transfers.map((t) => t.blockNumber));
  const metaBy = new Map(metas.map((m) => [lower(m.address), m]));
  const items: ActivityItem[] = transfers.map((t) => {
    const d = dir(owner, t.from, t.to);
    const m = metaBy.get(lower(t.token));
    return {
      id: `log:${t.txHash}:${t.logIndex}`,
      chainId,
      hash: t.txHash,
      kind: "token",
      direction: d,
      counterparty: d === "out" ? t.to : t.from,
      token: { address: t.token, symbol: m?.symbol ?? "?", decimals: m?.decimals ?? 18 },
      amount: t.value,
      timestamp: times.get(t.blockNumber) ?? 0,
      status: "success",
      method: null,
    };
  });
  return { items, cursor: null, source: "rpc", coverage: { fromBlock: scannedFrom, complete } };
}

/* =========================================================== exposure */

export type Footprint = {
  sentTxCount: number; // nonce: transactions this address has signed
  explorerTxCount: number | null; // everything the explorer indexes for it
  ens: string | null;
};

/** Facts only the chain can give: nonce (any chain), ENS (Ethereum), explorer counters where reachable. */
export async function loadFootprint(chainId: number, owner: Address, signal?: AbortSignal): Promise<Footprint> {
  const [nonce, ens, counters] = await Promise.all([
    publicClient(chainId).getTransactionCount({ address: owner }),
    publicClient(1)
      .getEnsName({ address: owner })
      .catch(() => null),
    fetchCounters(chainId, owner, signal).catch(() => null),
  ]);
  let ensName = ens;
  if (!ensName) ensName = await fetchAddressInfo(chainId, owner, signal).then((a) => a.ens).catch(() => null);
  return { sentTxCount: nonce, explorerTxCount: counters?.txCount ?? null, ens: ensName };
}

export type Counterparty = { address: Address; count: number; outCount: number; lastSeen: number };

export type ExposureFinding = { weight: number; max: number; title: string; detail: string };

export type Exposure = {
  score: number;
  level: "Low" | "Moderate" | "High" | "Severe";
  findings: ExposureFinding[];
  counterparties: Counterparty[];
  firstSeen: number | null;
  sample: number;
};

/**
 * What a stranger can learn from this address on a public ledger, scored 0-100.
 * Computed from real balances, the account nonce, loaded history and ENS.
 */
export function computeExposure(portfolio: Portfolio, footprint: Footprint, activity: ActivityItem[]): Exposure {
  const findings: ExposureFinding[] = [];

  // 1. Visible balance
  const held = portfolio.holdings.filter((h) => h.raw > 0n);
  const balWeight = held.length === 0 ? 0 : portfolio.totalUsd >= 1000 ? 25 : portfolio.totalUsd > 0 || held.length ? 12 : 0;
  findings.push({
    weight: balWeight,
    max: 25,
    title: held.length ? "Your balance is public" : "No visible balance",
    detail: held.length
      ? `Anyone can read ${held.length} holding${held.length > 1 ? "s" : ""} on this address${
          portfolio.totalUsd > 0 ? `, worth about $${Math.round(portfolio.totalUsd).toLocaleString("en-US")}` : ""
        }.`
      : "This address holds nothing a block explorer can show.",
  });

  // 2. Transaction history
  const n = Math.max(footprint.sentTxCount, footprint.explorerTxCount ?? 0);
  const txWeight = n === 0 ? 0 : n <= 10 ? 8 : n <= 100 ? 15 : 20;
  findings.push({
    weight: txWeight,
    max: 20,
    title: n ? `${n.toLocaleString("en-US")} transactions on record` : "No transaction history",
    detail: n
      ? `You have signed ${footprint.sentTxCount.toLocaleString("en-US")} transaction${footprint.sentTxCount === 1 ? "" : "s"} from this address. Each one is permanent and timestamped.`
      : "Nothing has been sent from this address yet.",
  });

  // 3. Counterparty graph
  const cp = new Map<string, Counterparty>();
  for (const a of activity) {
    if (!a.counterparty || a.direction === "self") continue;
    const k = lower(a.counterparty);
    const e = cp.get(k) ?? { address: a.counterparty, count: 0, outCount: 0, lastSeen: 0 };
    e.count++;
    if (a.direction === "out") e.outCount++;
    e.lastSeen = Math.max(e.lastSeen, a.timestamp);
    cp.set(k, e);
  }
  const counterparties = [...cp.values()].sort((a, b) => b.count - a.count);
  const c = counterparties.length;
  const cpWeight = c === 0 ? 0 : c <= 5 ? 8 : c <= 20 ? 15 : 20;
  findings.push({
    weight: cpWeight,
    max: 20,
    title: c ? `${c} counterpart${c === 1 ? "y" : "ies"} linked to you` : "No counterparties found",
    detail: c
      ? `Who you pay and who pays you is visible. Your most frequent counterparty appears in ${counterparties[0].count} transfer${counterparties[0].count === 1 ? "" : "s"}.`
      : "No transfers with other addresses in the loaded history.",
  });

  // 4. Identity link
  findings.push({
    weight: footprint.ens ? 20 : 0,
    max: 20,
    title: footprint.ens ? `Named as ${footprint.ens}` : "No public name attached",
    detail: footprint.ens
      ? "An ENS name ties this address, and everything above, to a readable identity."
      : "No ENS name resolves to this address.",
  });

  // 5. Token footprint
  const tokensTouched = new Set(activity.filter((a) => a.token && a.kind === "token").map((a) => lower(a.token!.address)));
  held.forEach((h) => !h.native && tokensTouched.add(lower(h.token)));
  const t = tokensTouched.size;
  findings.push({
    weight: t === 0 ? 0 : t <= 3 ? 5 : 10,
    max: 10,
    title: t ? `${t} token${t === 1 ? "" : "s"} in your footprint` : "No token footprint",
    detail: t ? "The assets you hold and trade reveal habits, platforms and positions." : "No ERC-20 activity found.",
  });

  // 6. Longevity
  const times = activity.map((a) => a.timestamp).filter(Boolean);
  const firstSeen = times.length ? Math.min(...times) : null;
  const days = firstSeen ? (Date.now() - firstSeen) / 86_400_000 : 0;
  findings.push({
    weight: days > 90 ? 5 : days > 0 ? 2 : 0,
    max: 5,
    title: firstSeen
      ? (() => {
          const d = Math.max(1, Math.round(days));
          return `Active for at least ${d} day${d === 1 ? "" : "s"}`;
        })()
      : "No dated activity",
    detail: firstSeen ? "A long public history makes patterns easy to reconstruct." : "No timestamps in the loaded history.",
  });

  const score = findings.reduce((s, f) => s + f.weight, 0);
  const level = score >= 75 ? "Severe" : score >= 50 ? "High" : score >= 25 ? "Moderate" : "Low";
  return { score, level, findings, counterparties, firstSeen, sample: activity.length };
}
