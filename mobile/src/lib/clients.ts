// Mirrors src/dashboard/lib/clients.ts in the web app. Keep the two in step.
import { createPublicClient, http, type PublicClient } from "viem";
import { mainnet, robinhood } from "viem/chains";

/**
 * Read-only clients for every supported chain. JSON-RPC batching is on so
 * multicall-style bursts (balances, token metadata) go out as one request.
 * Reads for a chain work whether or not the wallet is currently on it.
 */
const VIEM_CHAINS = { 4663: robinhood, 1: mainnet } as const;

const cache = new Map<number, PublicClient>();

export function publicClient(chainId: number): PublicClient {
  let c = cache.get(chainId);
  if (!c) {
    const chain = VIEM_CHAINS[chainId as keyof typeof VIEM_CHAINS] ?? robinhood;
    c = createPublicClient({ chain, transport: http(undefined, { batch: { wait: 16 }, retryCount: 3 }) }) as PublicClient;
    cache.set(chainId, c);
  }
  return c;
}

export const viemChain = (chainId: number) => VIEM_CHAINS[chainId as keyof typeof VIEM_CHAINS];
