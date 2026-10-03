import bs58 from "bs58";

/**
 * The network Spectral runs on: Solana mainnet.
 *
 * The dashboard keeps a numeric `chainId` so stored data (limits, credentials,
 * authorizations) stays keyed per network; 101 is Solana mainnet's id in the
 * Solana token list. The wallet layer uses the CAIP id below.
 */
export type ChainMeta = {
  id: number;
  caip: string;
  name: string;
  short: string;
  testnet: boolean;
  explorer: string;
  /** Tokens always checked even if discovery finds nothing. */
  knownTokens: KnownToken[];
};

export type KnownToken = { address: string; symbol: string; name: string; decimals: number; usdPegged?: boolean };

export const SOLANA_CHAIN_ID = 101;
export const DEFAULT_CHAIN_ID = SOLANA_CHAIN_ID;

/** Official mints (Circle and Tether). */
export const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";
export const USDT_MINT = "Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB";

export const CHAINS: Record<number, ChainMeta> = {
  [SOLANA_CHAIN_ID]: {
    id: SOLANA_CHAIN_ID,
    caip: "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp",
    name: "Solana",
    short: "Solana",
    testnet: false,
    explorer: "https://solscan.io",
    knownTokens: [
      { address: USDC_MINT, symbol: "USDC", name: "USD Coin", decimals: 6, usdPegged: true },
      { address: USDT_MINT, symbol: "USDT", name: "Tether USD", decimals: 6, usdPegged: true },
    ],
  },
};

export function chainMeta(_chainId?: number): ChainMeta {
  return CHAINS[SOLANA_CHAIN_ID];
}

export const isSupportedChain = (chainId: number | undefined) => chainId === SOLANA_CHAIN_ID;

export const txUrl = (_chainId: number, sig: string) => `https://solscan.io/tx/${sig}`;
export const addressUrl = (_chainId: number, address: string) => `https://solscan.io/account/${address}`;
export const tokenUrl = (_chainId: number, mint: string) => `https://solscan.io/token/${mint}`;

/**
 * Native SOL in holdings and authorizations. It is the wrapped-SOL mint, which
 * is also how price feeds identify SOL.
 */
export const NATIVE = "So11111111111111111111111111111111111111112";
export const SOL_DECIMALS = 9;

/** A base58 string that decodes to a 32-byte public key. */
export function isSolanaAddress(v: string | null | undefined): v is string {
  if (!v || v.length < 32 || v.length > 44) return false;
  try {
    return bs58.decode(v).length === 32;
  } catch {
    return false;
  }
}
