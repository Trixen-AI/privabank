import { isSolanaAddress } from "./chains";

/**
 * Runtime configuration. Only the Reown project ID is required; the rest turn
 * on protocol features once the matching infrastructure exists.
 */
// Vite injects import.meta.env; scripts and tests run without it.
const raw = (import.meta.env ?? {}) as Record<string, string | undefined>;

export const REOWN_PROJECT_ID: string = (raw.VITE_REOWN_PROJECT_ID ?? "").trim();

/**
 * Solana RPC for reads (balances, token accounts, history). Defaults to Reown's
 * RPC under the same project ID, which allows browser requests. Set a dedicated
 * endpoint (Helius, Triton, QuickNode...) for production traffic.
 */
export const SOLANA_RPC_URL: string =
  (raw.VITE_SOLANA_RPC_URL ?? "").trim() ||
  `https://rpc.walletconnect.org/v1/?chainId=solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp&projectId=${REOWN_PROJECT_ID}`;

/** Relayer base URL. Without it, authorizations settle from the user's wallet. */
export const RELAYER_URL: string = (raw.VITE_RELAYER_URL ?? "").trim().replace(/\/+$/, "");

const tokenMint = (raw.VITE_SPECTRAL_TOKEN_MINT ?? "").trim();
/** $SPECTRAL SPL token mint, once it exists. */
export const SPECTRAL_TOKEN_MINT: string | null = isSolanaAddress(tokenMint) ? tokenMint : null;
