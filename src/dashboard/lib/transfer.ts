import { Connection, PublicKey, SystemProgram, Transaction } from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createTransferCheckedInstruction,
  getAssociatedTokenAddressSync,
} from "@solana/spl-token";
import { NATIVE } from "./chains";
import { SOLANA_RPC_URL } from "./env";
import { getSignatureStatus } from "./rpc";

/** web3.js connection for building and sending transactions (reads go through ./rpc). */
let conn: Connection | null = null;
export const connection = () => (conn ??= new Connection(SOLANA_RPC_URL, "confirmed"));

/**
 * Builds the settlement transfer for an authorization: a SOL transfer, or an
 * SPL `transferChecked` from the payer's associated token account. The
 * recipient's token account is created first if it doesn't exist yet (the
 * payer covers that one-off rent, about 0.002 SOL).
 */
export async function buildTransfer(input: { from: string; to: string; mint: string; amount: bigint; decimals: number }) {
  const c = connection();
  const from = new PublicKey(input.from);
  const to = new PublicKey(input.to);
  const tx = new Transaction();

  if (input.mint === NATIVE) {
    tx.add(SystemProgram.transfer({ fromPubkey: from, toPubkey: to, lamports: input.amount }));
  } else {
    const mint = new PublicKey(input.mint);
    const mintInfo = await c.getAccountInfo(mint);
    if (!mintInfo) throw new Error("That token mint doesn't exist on Solana.");
    const programId = mintInfo.owner; // Token or Token-2022
    const source = getAssociatedTokenAddressSync(mint, from, true, programId);
    const dest = getAssociatedTokenAddressSync(mint, to, true, programId);
    tx.add(createAssociatedTokenAccountIdempotentInstruction(from, dest, to, mint, programId));
    tx.add(createTransferCheckedInstruction(source, mint, dest, from, input.amount, input.decimals, [], programId));
  }

  const { blockhash, lastValidBlockHeight } = await c.getLatestBlockhash("confirmed");
  tx.recentBlockhash = blockhash;
  tx.feePayer = from;
  return { tx, lastValidBlockHeight };
}

/** Network fee for a transaction, in lamports. */
export async function estimateFee(tx: Transaction) {
  const fee = await connection().getFeeForMessage(tx.compileMessage(), "confirmed");
  return fee.value == null ? null : BigInt(fee.value);
}

/** Polls until the transaction is confirmed or fails. Resolves true on success. */
export async function waitForSignature(sig: string, timeoutMs = 90_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    const s = await getSignatureStatus(sig).catch(() => null);
    if (s?.err) return false;
    if (s && (s.confirmationStatus === "confirmed" || s.confirmationStatus === "finalized")) return true;
    await new Promise((r) => setTimeout(r, 1500));
  }
  throw new Error("The network hasn't confirmed this transaction yet. Check it on Solscan.");
}
