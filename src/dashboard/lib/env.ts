import { isAddress, type Address } from "viem";

/**
 * Runtime configuration. Only the Reown project ID is required; the rest turn
 * on protocol features once the matching infrastructure exists.
 */
// Vite injects import.meta.env; scripts and tests run without it.
const raw = (import.meta.env ?? {}) as Record<string, string | undefined>;

export const REOWN_PROJECT_ID: string = (raw.VITE_REOWN_PROJECT_ID ?? "").trim();

/** Relayer base URL. Without it, authorizations settle from the user's wallet. */
export const RELAYER_URL: string = (raw.VITE_RELAYER_URL ?? "").trim().replace(/\/+$/, "");

const tokenAddr = (raw.VITE_PRIVA_TOKEN_ADDRESS ?? "").trim();
/** $PRIVA contract, if deployed. */
export const PRIVA_TOKEN: { address: Address; chainId: number } | null = isAddress(tokenAddr)
  ? { address: tokenAddr, chainId: Number(raw.VITE_PRIVA_TOKEN_CHAIN_ID ?? 4663) }
  : null;
