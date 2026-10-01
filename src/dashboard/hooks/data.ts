import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAppKitAccount } from "@reown/appkit/react";
import { useAccount } from "wagmi";
import type { Address } from "viem";
import { DEFAULT_CHAIN_ID, isSupportedChain } from "../lib/chains";
import { publicClient } from "../lib/clients";
import {
  computeExposure,
  loadActivityPage,
  loadFootprint,
  loadPortfolio,
  type ActivityCursor,
  type ActivityItem,
} from "../lib/data";
import { relayerHealth } from "../lib/protocol";

/**
 * The connected wallet as the dashboard sees it. `chainId` falls back to
 * Robinhood Chain when the wallet sits on a network PrivaBank doesn't support,
 * and `unsupported` tells the UI to offer a switch.
 */
export function useWallet() {
  const { address, chainId: walletChain, connector, isConnected, status } = useAccount();
  const { embeddedWalletInfo } = useAppKitAccount();
  const unsupported = isConnected && !isSupportedChain(walletChain);
  return {
    address: address as Address | undefined,
    isConnected,
    connecting: status === "connecting" || status === "reconnecting",
    chainId: unsupported || !walletChain ? DEFAULT_CHAIN_ID : walletChain,
    walletChain,
    unsupported,
    connectorName: connector?.name ?? null,
    loginMethod: embeddedWalletInfo?.authProvider ?? null,
    loginEmail: (embeddedWalletInfo?.user as { email?: string } | undefined)?.email ?? null,
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

/** Flattened activity across loaded pages. */
export const flattenActivity = (pages: { items: ActivityItem[] }[] | undefined) => pages?.flatMap((p) => p.items) ?? [];

export function useFootprint(chainId: number, address: Address | undefined) {
  return useQuery({
    queryKey: ["footprint", chainId, address],
    queryFn: ({ signal }) => loadFootprint(chainId, address!, signal),
    enabled: !!address,
    staleTime: 5 * 60_000,
  });
}

/** Exposure = portfolio + footprint + the first page of activity, derived during render. */
export function useExposure(chainId: number, address: Address | undefined) {
  const portfolio = usePortfolio(chainId, address);
  const footprint = useFootprint(chainId, address);
  const activity = useActivity(chainId, address);
  const items = flattenActivity(activity.data?.pages);
  const ready = portfolio.data && footprint.data && activity.data;
  return {
    exposure: ready ? computeExposure(portfolio.data!, footprint.data!, items) : null,
    footprint: footprint.data,
    loading: portfolio.isLoading || footprint.isLoading || activity.isLoading,
    error: portfolio.error ?? footprint.error ?? activity.error,
    activitySource: activity.data?.pages[0]?.source,
  };
}

/** Live chain vitals for the network card: head block, gas price, and block time. */
export function useChainStats(chainId: number) {
  return useQuery({
    queryKey: ["chain-stats", chainId],
    queryFn: async () => {
      const c = publicClient(chainId);
      const [block, gasPrice] = await Promise.all([c.getBlock(), c.getGasPrice()]);
      const earlier = await c.getBlock({ blockNumber: block.number - 100n > 0n ? block.number - 100n : 0n });
      const span = Number(block.timestamp - earlier.timestamp);
      return { head: block.number, gasPrice, blockTime: span > 0 ? span / Number(block.number - earlier.number) : null };
    },
    refetchInterval: 15_000,
  });
}

export function useRelayerHealth() {
  return useQuery({ queryKey: ["relayer-health"], queryFn: relayerHealth, refetchInterval: 60_000 });
}
