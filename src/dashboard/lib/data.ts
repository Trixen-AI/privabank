import { chainMeta, NATIVE, SOL_DECIMALS, SOLANA_CHAIN_ID } from "./chains";
import {
  getBalance,
  getSignatures,
  getTokenAccounts,
  getTransaction,
  rpc,
  type ParsedInstruction,
  type ParsedTx,
  type SignatureInfo,
} from "./rpc";

/* =========================================================== token metadata + prices (Jupiter) */

/**
 * Jupiter's public APIs: token names and icons, and USD prices. Both allow
 * browser requests. Prices come with liquidity, which is used to ignore tokens
 * whose quoted value could never actually be sold.
 */
const JUP = "https://lite-api.jup.ag";

type JupToken = { id: string; name: string; symbol: string; icon?: string; decimals: number };
type JupPrice = { usdPrice: number; liquidity?: number };

const metaCache = new Map<string, JupToken | null>();

async function tokenMeta(mints: string[]): Promise<Map<string, JupToken | null>> {
  const missing = mints.filter((m) => !metaCache.has(m));
  // The search endpoint takes up to 100 comma-separated mints per call.
  for (let i = 0; i < missing.length; i += 100) {
    const chunk = missing.slice(i, i + 100);
    try {
      const r = await fetch(`${JUP}/tokens/v2/search?query=${chunk.join(",")}`);
      const list = r.ok ? ((await r.json()) as JupToken[]) : [];
      const byId = new Map(list.map((t) => [t.id, t]));
      chunk.forEach((m) => metaCache.set(m, byId.get(m) ?? null));
    } catch {
      chunk.forEach((m) => metaCache.set(m, null));
    }
  }
  return new Map(mints.map((m) => [m, metaCache.get(m) ?? null]));
}

async function prices(mints: string[]): Promise<Map<string, JupPrice>> {
  const out = new Map<string, JupPrice>();
  for (let i = 0; i < mints.length; i += 50) {
    const chunk = mints.slice(i, i + 50);
    try {
      const r = await fetch(`${JUP}/price/v3?ids=${chunk.join(",")}`);
      if (!r.ok) continue;
      const j = (await r.json()) as Record<string, JupPrice | null>;
      for (const [k, v] of Object.entries(j)) if (v?.usdPrice != null) out.set(k, v);
    } catch {
      /* prices are optional: holdings still show without them */
    }
  }
  return out;
}

/* =========================================================== portfolio */

export type Holding = {
  token: string; // mint; NATIVE for SOL
  /** Market value if we had a price but it was not counted (illiquid). */
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
  source: "rpc";
};

const toNum = (raw: bigint, decimals: number) => Number(raw) / 10 ** decimals;

/**
 * A position is counted in the total only when the token's market could absorb
 * it: wallets collect unsolicited airdrops whose quoted "value" is unsellable.
 */
function liquidUsd(amount: number, p: JupPrice | undefined) {
  if (!p) return { usd: null, illiquid: undefined };
  const value = amount * p.usdPrice;
  if (p.liquidity == null || p.liquidity >= value * 2) return { usd: value, illiquid: undefined };
  return { usd: null, illiquid: value };
}

export async function loadPortfolio(_chainId: number, owner: string): Promise<Portfolio> {
  const meta = chainMeta();
  const [lamports, accounts] = await Promise.all([getBalance(owner), getTokenAccounts(owner)]);

  // Sum per mint (a wallet can hold several accounts for one token).
  const byMint = new Map<string, { raw: bigint; decimals: number }>();
  for (const a of accounts) {
    const info = a.account.data.parsed.info;
    const raw = BigInt(info.tokenAmount.amount);
    if (raw === 0n) continue;
    const cur = byMint.get(info.mint);
    byMint.set(info.mint, { raw: (cur?.raw ?? 0n) + raw, decimals: info.tokenAmount.decimals });
  }
  const mints = [...byMint.keys()];
  const [metas, px] = await Promise.all([tokenMeta(mints), prices([NATIVE, ...mints])]);

  const tokens: Holding[] = mints.map((mint) => {
    const { raw, decimals } = byMint.get(mint)!;
    const known = meta.knownTokens.find((k) => k.address === mint);
    const m = metas.get(mint);
    const { usd, illiquid } = known?.usdPegged
      ? { usd: toNum(raw, decimals), illiquid: undefined }
      : liquidUsd(toNum(raw, decimals), px.get(mint));
    return {
      token: mint,
      symbol: known?.symbol ?? m?.symbol ?? `${mint.slice(0, 4)}…`,
      name: known?.name ?? m?.name ?? "Unknown token",
      decimals,
      raw,
      usd,
      illiquidUsd: illiquid,
      icon: m?.icon ?? null,
      native: false,
    };
  });

  const solPrice = px.get(NATIVE)?.usdPrice ?? null;
  const native: Holding = {
    token: NATIVE,
    symbol: "SOL",
    name: "Solana",
    decimals: SOL_DECIMALS,
    raw: lamports,
    usd: solPrice != null ? toNum(lamports, SOL_DECIMALS) * solPrice : null,
    icon: null,
    native: true,
  };

  // Priced value first; among unpriced assets SOL leads, so an airdropped token
  // with an odd symbol never becomes the default choice.
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
  return { chainId: SOLANA_CHAIN_ID, holdings, totalUsd, unpriced, source: "rpc" };
}

/* =========================================================== activity */

export type ActivityItem = {
  id: string;
  chainId: number;
  hash: string; // transaction signature
  kind: "native" | "token" | "call";
  direction: "in" | "out" | "self";
  counterparty: string | null;
  token: { address: string; symbol: string; decimals: number } | null;
  amount: bigint;
  timestamp: number;
  status: "success" | "failed" | "pending";
  method: string | null;
};

export type ActivityCursor = { before: string };

export type ActivityPage = {
  items: ActivityItem[];
  cursor: ActivityCursor | null;
  source: "rpc";
};

const PAGE = 20;

/** The program a transaction mostly talks to, as a readable label for calls. */
function callLabel(ixs: ParsedInstruction[]) {
  const named = ixs.find((i) => i.program && !["compute-budget", "spl-memo"].includes(i.program));
  if (!named) return "Program call";
  const type = typeof named.parsed === "object" && named.parsed ? named.parsed.type : null;
  return type ? `${named.program} · ${type}` : (named.program ?? "Program call");
}

/** Finds who sent to or received from `owner` in a simple transfer instruction. */
function transferCounterparty(ixs: ParsedInstruction[], owner: string, ownerAccounts: Set<string>): string | null {
  for (const ix of ixs) {
    if (typeof ix.parsed !== "object" || !ix.parsed) continue;
    const t = ix.parsed.type;
    const info = ix.parsed.info as Record<string, string>;
    if (ix.program === "system" && t === "transfer") {
      if (info.source === owner) return info.destination;
      if (info.destination === owner) return info.source;
    }
    if ((ix.program === "spl-token" || ix.program === "spl-token-2022") && (t === "transfer" || t === "transferChecked")) {
      const from = info.authority ?? info.multisigAuthority ?? info.source;
      if (from === owner || ownerAccounts.has(info.source)) return info.destination;
      if (ownerAccounts.has(info.destination)) return info.authority ?? info.source;
    }
  }
  return null;
}

/**
 * Turns one parsed transaction into what it meant for `owner`: the largest
 * balance change in SOL or a token, its direction, and the other party when the
 * transaction is a plain transfer.
 */
function toItem(owner: string, sig: SignatureInfo, tx: ParsedTx | null, symbols: Map<string, string>): ActivityItem {
  const base: ActivityItem = {
    id: sig.signature,
    chainId: SOLANA_CHAIN_ID,
    hash: sig.signature,
    kind: "call",
    direction: "out",
    counterparty: null,
    token: null,
    amount: 0n,
    timestamp: (sig.blockTime ?? tx?.blockTime ?? 0) * 1000,
    status: sig.err ? "failed" : "success",
    method: null,
  };
  if (!tx?.meta) return base;

  const keys = tx.transaction.message.accountKeys.map((k) => k.pubkey);
  const ixs = tx.transaction.message.instructions;
  const meIdx = keys.indexOf(owner);
  const signer = tx.transaction.message.accountKeys.find((k) => k.signer)?.pubkey;

  // Token balance changes for accounts owned by `owner`.
  const ownerAccounts = new Set<string>();
  const deltas = new Map<string, { delta: bigint; decimals: number }>();
  const add = (list: typeof tx.meta.preTokenBalances, sign: 1n | -1n) => {
    for (const b of list ?? []) {
      if (b.owner !== owner) continue;
      ownerAccounts.add(keys[b.accountIndex]);
      const cur = deltas.get(b.mint) ?? { delta: 0n, decimals: b.uiTokenAmount.decimals };
      cur.delta += sign * BigInt(b.uiTokenAmount.amount);
      deltas.set(b.mint, cur);
    }
  };
  add(tx.meta.postTokenBalances, 1n);
  add(tx.meta.preTokenBalances, -1n);

  const tokenMove = [...deltas.entries()].filter(([, d]) => d.delta !== 0n).sort((a, b) => (b[1].delta < 0n ? -b[1].delta : b[1].delta) > (a[1].delta < 0n ? -a[1].delta : a[1].delta) ? 1 : -1)[0];

  // SOL change, ignoring the fee when the owner paid it.
  let solDelta = meIdx >= 0 ? BigInt(tx.meta.postBalances[meIdx]) - BigInt(tx.meta.preBalances[meIdx]) : 0n;
  if (signer === owner) solDelta += BigInt(tx.meta.fee);

  const counterparty = transferCounterparty(ixs, owner, ownerAccounts);

  if (tokenMove) {
    const [mint, d] = tokenMove;
    return {
      ...base,
      kind: "token",
      direction: d.delta > 0n ? "in" : "out",
      counterparty,
      token: { address: mint, symbol: symbols.get(mint) ?? `${mint.slice(0, 4)}…`, decimals: d.decimals },
      amount: d.delta < 0n ? -d.delta : d.delta,
    };
  }
  // Rent and fees alone produce tiny changes; only count a real SOL move.
  if (solDelta !== 0n && (solDelta > 5000n || solDelta < -5000n)) {
    return {
      ...base,
      kind: "native",
      direction: solDelta > 0n ? "in" : "out",
      counterparty,
      token: { address: NATIVE, symbol: "SOL", decimals: SOL_DECIMALS },
      amount: solDelta < 0n ? -solDelta : solDelta,
    };
  }
  return { ...base, method: callLabel(ixs) };
}

export async function loadActivityPage(_chainId: number, owner: string, cursor: ActivityCursor | null): Promise<ActivityPage> {
  const sigs = await getSignatures(owner, { limit: PAGE, before: cursor?.before });
  const txs = await Promise.all(sigs.map((s) => getTransaction(s.signature).catch(() => null)));

  // Names for every mint that moved, in one lookup.
  const mints = new Set<string>();
  for (const tx of txs) for (const b of [...(tx?.meta?.postTokenBalances ?? []), ...(tx?.meta?.preTokenBalances ?? [])]) mints.add(b.mint);
  const meta = chainMeta();
  const metas = await tokenMeta([...mints].filter((m) => !meta.knownTokens.some((k) => k.address === m)));
  const symbols = new Map<string, string>([...meta.knownTokens.map((k) => [k.address, k.symbol] as [string, string])]);
  metas.forEach((m, mint) => m && symbols.set(mint, m.symbol));

  const items = sigs.map((s, i) => toItem(owner, s, txs[i], symbols));
  return {
    items,
    cursor: sigs.length === PAGE ? { before: sigs[sigs.length - 1].signature } : null,
    source: "rpc",
  };
}

/* =========================================================== exposure */

export type Footprint = {
  /** Transactions this address appears in, counted up to `txCountCapped`. */
  txCount: number;
  txCountCapped: boolean;
  /** Its .sol name, if it has a favourite one. */
  name: string | null;
};

const COUNT_LIMIT = 1000;

/** Facts the public chain gives away: how much history the address has, and its .sol name. */
export async function loadFootprint(_chainId: number, owner: string): Promise<Footprint> {
  const [sigs, name] = await Promise.all([
    getSignatures(owner, { limit: COUNT_LIMIT }).catch(() => [] as SignatureInfo[]),
    favoriteSolName(owner),
  ]);
  return { txCount: sigs.length, txCountCapped: sigs.length >= COUNT_LIMIT, name };
}

/* =========================================================== .sol names (Solana Name Service) */

// SNS's public SDK proxy; it allows browser requests.
const SNS = "https://sdk-proxy.sns.id";

/** The owner of `name.sol`, or null when the name isn't registered. */
export async function resolveSolName(name: string): Promise<string | null> {
  const label = name.trim().toLowerCase().replace(/\.sol$/, "");
  const r = await fetch(`${SNS}/resolve/${encodeURIComponent(label)}`);
  const j = (await r.json()) as { s: string; result: string };
  return j.s === "ok" ? j.result : null;
}

/** The .sol name an address has chosen to display, if any. */
export async function favoriteSolName(owner: string): Promise<string | null> {
  try {
    const r = await fetch(`${SNS}/favorite-domain/${owner}`);
    const j = (await r.json()) as { s: string; result?: { reverse?: string } };
    return j.s === "ok" && j.result?.reverse ? `${j.result.reverse}.sol` : null;
  } catch {
    return null;
  }
}

export type Counterparty = { address: string; count: number; outCount: number; lastSeen: number };

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
 * Computed from real balances, transaction history and the .sol name.
 */
export function computeExposure(portfolio: Portfolio, footprint: Footprint, activity: ActivityItem[]): Exposure {
  const findings: ExposureFinding[] = [];

  // 1. Visible balance
  const held = portfolio.holdings.filter((h) => h.raw > 0n);
  const balWeight = held.length === 0 ? 0 : portfolio.totalUsd >= 1000 ? 25 : 12;
  findings.push({
    weight: balWeight,
    max: 25,
    title: held.length ? "Your balance is public" : "No visible balance",
    detail: held.length
      ? `Anyone can read ${held.length} holding${held.length > 1 ? "s" : ""} on this address${
          portfolio.totalUsd > 0 ? `, worth about $${Math.round(portfolio.totalUsd).toLocaleString("en-US")}` : ""
        }.`
      : "This address holds nothing an explorer can show.",
  });

  // 2. Transaction history
  const n = footprint.txCount;
  const nLabel = `${footprint.txCountCapped ? "1,000+" : n.toLocaleString("en-US")}`;
  const txWeight = n === 0 ? 0 : n <= 10 ? 8 : n <= 100 ? 15 : 20;
  findings.push({
    weight: txWeight,
    max: 20,
    title: n ? `${nLabel} transactions on record` : "No transaction history",
    detail: n
      ? "Every transaction this address took part in is permanent, timestamped and searchable on Solscan."
      : "This address hasn't appeared in a transaction yet.",
  });

  // 3. Counterparty graph
  const cp = new Map<string, Counterparty>();
  for (const a of activity) {
    if (!a.counterparty || a.direction === "self") continue;
    const e = cp.get(a.counterparty) ?? { address: a.counterparty, count: 0, outCount: 0, lastSeen: 0 };
    e.count++;
    if (a.direction === "out") e.outCount++;
    e.lastSeen = Math.max(e.lastSeen, a.timestamp);
    cp.set(a.counterparty, e);
  }
  const counterparties = [...cp.values()].sort((a, b) => b.count - a.count);
  const c = counterparties.length;
  findings.push({
    weight: c === 0 ? 0 : c <= 5 ? 8 : c <= 20 ? 15 : 20,
    max: 20,
    title: c ? `${c} counterpart${c === 1 ? "y" : "ies"} linked to you` : "No counterparties found",
    detail: c
      ? `Who you pay and who pays you is visible. Your most frequent counterparty appears in ${counterparties[0].count} transfer${counterparties[0].count === 1 ? "" : "s"}.`
      : "No transfers with other addresses in the loaded history.",
  });

  // 4. Identity link
  findings.push({
    weight: footprint.name ? 20 : 0,
    max: 20,
    title: footprint.name ? `Named as ${footprint.name}` : "No public name attached",
    detail: footprint.name
      ? "A .sol name ties this address, and everything above, to a readable identity."
      : "No .sol name points at this address.",
  });

  // 5. Token footprint
  const tokensTouched = new Set(activity.filter((a) => a.token && a.kind === "token").map((a) => a.token!.address));
  held.forEach((h) => !h.native && tokensTouched.add(h.token));
  const t = tokensTouched.size;
  findings.push({
    weight: t === 0 ? 0 : t <= 3 ? 5 : 10,
    max: 10,
    title: t ? `${t} token${t === 1 ? "" : "s"} in your footprint` : "No token footprint",
    detail: t ? "The assets you hold and trade reveal habits, platforms and positions." : "No SPL token activity found.",
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

/* =========================================================== network vitals */

export async function loadChainStats() {
  const [slot, height, samples] = await Promise.all([
    rpc<number>("getSlot"),
    rpc<number>("getBlockHeight"),
    rpc<{ numTransactions: number; numSlots: number; samplePeriodSecs: number }[]>("getRecentPerformanceSamples", [4]),
  ]);
  const tx = samples.reduce((s, x) => s + x.numTransactions, 0);
  const secs = samples.reduce((s, x) => s + x.samplePeriodSecs, 0);
  const slots = samples.reduce((s, x) => s + x.numSlots, 0);
  return { slot, height, tps: secs ? tx / secs : null, slotTime: slots ? secs / slots : null };
}
