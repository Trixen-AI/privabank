import { SOLANA_RPC_URL } from "./env";

/**
 * Minimal Solana JSON-RPC client for reads. Plain fetch keeps the reads light
 * and lets us ask for newer transaction versions than @solana/web3.js knows
 * (`maxSupportedTransactionVersion: 1`). Calls made in the same tick are
 * grouped into small batches; busy (429) and unavailable (503) answers are
 * retried with backoff, and only a couple of requests are in flight at once,
 * which keeps shared public endpoints from refusing the dashboard.
 */

type Pending = { method: string; params: unknown[]; resolve: (v: unknown) => void; reject: (e: unknown) => void };

let queue: Pending[] = [];
let timer: number | null = null;
const MAX_BATCH = 5;
const MAX_IN_FLIGHT = 4;
const RETRIES = 4;

export class RpcError extends Error {
  code?: number;
  constructor(message: string, code?: number) {
    super(message);
    this.name = "RpcError";
    this.code = code;
  }
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

let inFlight = 0;
const waiting: (() => void)[] = [];
async function slot() {
  if (inFlight < MAX_IN_FLIGHT) {
    inFlight++;
    return;
  }
  await new Promise<void>((r) => waiting.push(r));
  inFlight++;
}
function release() {
  inFlight--;
  waiting.shift()?.();
}

type RpcReply = { id: number; result?: unknown; error?: { message: string; code: number } };

async function post(chunk: Pending[]): Promise<RpcReply[]> {
  for (let attempt = 0; ; attempt++) {
    const res = await fetch(SOLANA_RPC_URL, {
      method: "POST",
      headers: { "content-type": "application/json" },
      // A lone call is sent as a plain object, not a one-item array: Reown routes
      // array bodies to a different provider, which refuses heavy reads.
      body: JSON.stringify(
        chunk.length === 1
          ? { jsonrpc: "2.0", id: 0, method: chunk[0].method, params: chunk[0].params }
          : chunk.map((p, id) => ({ jsonrpc: "2.0", id, method: p.method, params: p.params })),
      ),
    });
    if (res.ok) {
      const out = (await res.json()) as RpcReply[] | RpcReply;
      return Array.isArray(out) ? out : [out];
    }
    if ((res.status === 429 || res.status >= 500) && attempt < RETRIES) {
      await sleep(400 * 2 ** attempt + Math.random() * 200);
      continue;
    }
    throw new RpcError(`Solana RPC returned ${res.status}`, res.status);
  }
}

async function send(chunk: Pending[]) {
  await slot();
  try {
    const out = await post(chunk);
    for (const r of out) {
      const p = chunk[r.id];
      if (!p) continue;
      if (r.error) p.reject(new RpcError(r.error.message, r.error.code));
      else p.resolve(r.result);
    }
    // Anything the node left unanswered fails rather than hanging forever.
    const answered = new Set(out.map((r) => r.id));
    chunk.forEach((p, id) => !answered.has(id) && p.reject(new RpcError("No response from Solana RPC")));
  } catch (e) {
    chunk.forEach((p) => p.reject(e));
  } finally {
    release();
  }
}

// Heavy calls go one per request: Reown's RPC allows a single getTransaction per
// batch, and large token-account lists batched together come back as 503.
const SOLO = new Set(["getTransaction", "getTokenAccountsByOwner", "getSignaturesForAddress"]);

function flush() {
  timer = null;
  const batch = queue.filter((p) => !SOLO.has(p.method));
  const solo = queue.filter((p) => SOLO.has(p.method));
  queue = [];
  for (let i = 0; i < batch.length; i += MAX_BATCH) void send(batch.slice(i, i + MAX_BATCH));
  for (const p of solo) void send([p]);
}

export function rpc<T>(method: string, params: unknown[] = []): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    queue.push({ method, params, resolve: resolve as (v: unknown) => void, reject });
    timer ??= window.setTimeout(flush, 8);
  });
}

/* ---------------- typed helpers ---------------- */

export type ParsedTokenAccount = {
  pubkey: string;
  account: {
    data: {
      parsed: {
        info: { mint: string; owner: string; tokenAmount: { amount: string; decimals: number; uiAmountString: string } };
      };
      program: string;
    };
  };
};

export const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA";
export const TOKEN_2022_PROGRAM = "TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb";

export const getBalance = (owner: string) =>
  rpc<{ value: number }>("getBalance", [owner, { commitment: "confirmed" }]).then((r) => BigInt(r.value));

/**
 * Every SPL token account the owner holds, from both token programs. Fetched one
 * after the other: big wallets return hundreds of kilobytes per list, and two at
 * once get refused by shared RPCs. A failed Token-2022 list (rarely used) doesn't
 * hide the classic token balances.
 */
export async function getTokenAccounts(owner: string) {
  const a = await rpc<{ value: ParsedTokenAccount[] }>("getTokenAccountsByOwner", [owner, { programId: TOKEN_PROGRAM }, { encoding: "jsonParsed" }]);
  const b = await rpc<{ value: ParsedTokenAccount[] }>("getTokenAccountsByOwner", [owner, { programId: TOKEN_2022_PROGRAM }, { encoding: "jsonParsed" }]).catch(
    () => ({ value: [] as ParsedTokenAccount[] }),
  );
  return [...a.value, ...b.value];
}

export type SignatureInfo = { signature: string; slot: number; blockTime: number | null; err: unknown; memo: string | null };

export const getSignatures = (owner: string, opts: { limit?: number; before?: string } = {}) =>
  rpc<SignatureInfo[]>("getSignaturesForAddress", [owner, { limit: opts.limit ?? 25, ...(opts.before ? { before: opts.before } : {}) }]);

type AccountKey = { pubkey: string; signer: boolean; writable: boolean };
type TokenBalance = { accountIndex: number; mint: string; owner?: string; uiTokenAmount: { amount: string; decimals: number } };
export type ParsedInstruction = {
  program?: string;
  programId: string;
  parsed?: { type: string; info: Record<string, unknown> } | string;
};
export type ParsedTx = {
  blockTime: number | null;
  slot: number;
  meta: {
    err: unknown;
    fee: number;
    preBalances: number[];
    postBalances: number[];
    preTokenBalances?: TokenBalance[];
    postTokenBalances?: TokenBalance[];
  } | null;
  transaction: { message: { accountKeys: AccountKey[]; instructions: ParsedInstruction[] }; signatures: string[] };
};

export const getTransaction = (sig: string) =>
  rpc<ParsedTx | null>("getTransaction", [sig, { encoding: "jsonParsed", maxSupportedTransactionVersion: 1, commitment: "confirmed" }]);

export const getSignatureStatus = (sig: string) =>
  rpc<{ value: ({ confirmationStatus: string | null; err: unknown } | null)[] }>("getSignatureStatuses", [[sig], { searchTransactionHistory: false }]).then(
    (r) => r.value[0],
  );

export type PerfSample = { numTransactions: number; numSlots: number; samplePeriodSecs: number; slot: number };
