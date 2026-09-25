import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import { DEFAULT_CHAIN_ID, isSupportedChain } from "@/lib/chains";
import { publicClient } from "@/lib/clients";
import { loadActivityPage, loadPortfolio, type ActivityCursor, type ActivityItem } from "@/lib/data";

/**
 * The connected wallet as the app sees it. `chainId` falls back to Robinhood
 * Chain when the wallet sits on a network CassaFi doesn't run on, and
 * `unsupported` tells the UI to offer a switch. Mirrors useWallet in the web app.
 */
export function useWallet() {
  const { address, chainId: walletChain, connector, isConnected, status } = useAccount();
  const unsupported = isConnected && !isSupportedChain(walletChain);
  return {
    address: address as Address | undefined,
    isConnected,
    connecting: status === "connecting" || status === "reconnecting",
    chainId: unsupported || !walletChain ? DEFAULT_CHAIN_ID : walletChain,
    walletChain,
    unsupported,
    connectorName: connector?.name ?? null,
  };
}

export function usePortfolio(chainId: number, address: Address | undefined) {
  return useQuery({
    queryKey: ["portfolio", chainId, address],
    queryFn: ({ signal }) => loadPortfolio(chainId, address!, signal),
    enabled: !!address,
    refetchInterval: 60_000,
  });
}

export function useActivity(chainId: number, address: Address | undefined) {
  return useInfiniteQuery({
    queryKey: ["activity", chainId, address],
    queryFn: ({ pageParam, signal }) => loadActivityPage(chainId, address!, pageParam, signal),
    initialPageParam: null as ActivityCursor | null,
    getNextPageParam: (last) => last.cursor ?? undefined,
    enabled: !!address,
  });
}

export const flattenActivity = (pages: { items: ActivityItem[] }[] | undefined) => pages?.flatMap((p) => p.items) ?? [];

/** Head block and gas price, for the network row. */
export function useChainStats(chainId: number) {
  return useQuery({
    queryKey: ["chain-stats", chainId],
    queryFn: async () => {
      const c = publicClient(chainId);
      const [head, gasPrice] = await Promise.all([c.getBlockNumber(), c.getGasPrice()]);
      return { head, gasPrice };
    },
    refetchInterval: 20_000,
  });
}
