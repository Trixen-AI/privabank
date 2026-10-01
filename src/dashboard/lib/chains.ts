import type { Address } from "viem";

/**
 * Networks PrivaBank runs on, with the data sources the dashboard reads for each.
 *
 * Chain ID and RPC were checked against the live endpoint (eth_chainId):
 *   Robinhood Chain  4663  rpc.mainnet.chain.robinhood.com
 *
 * `explorerApi` is a Blockscout v2 API. Where it is unreachable from a browser
 * (Robinhood Chain mainnet sits behind a Cloudflare challenge), the dashboard
 * falls back to reading ERC-20 Transfer logs straight from the RPC.
 */
export type ChainMeta = {
  id: number;
  name: string;
  short: string;
  testnet: boolean;
  explorer: string;
  explorerApi: string;
  /** Tokens always offered even if discovery finds nothing (Ethereum majors). */
  knownTokens: KnownToken[];
};

export type KnownToken = { address: Address; symbol: string; decimals: number; usdPegged?: boolean };

export const DEFAULT_CHAIN_ID = 4663;

export const CHAINS: Record<number, ChainMeta> = {
  4663: {
    id: 4663,
    name: "Robinhood Chain",
    short: "Robinhood",
    testnet: false,
    explorer: "https://robinhoodchain.blockscout.com",
    explorerApi: "https://robinhoodchain.blockscout.com/api/v2",
    knownTokens: [],
  },
  1: {
    id: 1,
    name: "Ethereum",
    short: "Ethereum",
    testnet: false,
    explorer: "https://eth.blockscout.com",
    explorerApi: "https://eth.blockscout.com/api/v2",
    knownTokens: [
      { address: "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48", symbol: "USDC", decimals: 6, usdPegged: true },
      { address: "0xdAC17F958D2ee523a2206206994597C13D831ec7", symbol: "USDT", decimals: 6, usdPegged: true },
    ],
  },
};

export function chainMeta(chainId: number | undefined): ChainMeta {
  return (chainId && CHAINS[chainId]) || CHAINS[DEFAULT_CHAIN_ID];
}

export const isSupportedChain = (chainId: number | undefined) => !!chainId && chainId in CHAINS;

export const txUrl = (chainId: number, hash: string) => `${chainMeta(chainId).explorer}/tx/${hash}`;
export const addressUrl = (chainId: number, address: string) => `${chainMeta(chainId).explorer}/address/${address}`;
export const tokenUrl = (chainId: number, address: string) => `${chainMeta(chainId).explorer}/token/${address}`;

/** Native asset sentinel used in authorizations and holdings. */
export const NATIVE: Address = "0x0000000000000000000000000000000000000000";
