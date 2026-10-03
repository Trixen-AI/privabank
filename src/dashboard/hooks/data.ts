import { useCallback } from "react";
import { useInfiniteQuery, useQuery } from "@tanstack/react-query";
import { useAppKitAccount, useAppKitProvider, useWalletInfo } from "@reown/appkit/react";
import type { Provider } from "@reown/appkit-adapter-solana/react";
import bs58 from "bs58";
import type { Transaction } from "@solana/web3.js";
import { SOLANA_CHAIN_ID } from "../lib/chains";
import {
  computeExposure,
  loadActivityPage,
  loadChainStats,
  loadFootprint,
  loadPortfolio,
  type ActivityCursor,
  type ActivityItem,
} from "../lib/data";
import { relayerHealth } from "../lib/protocol";
import { connection } from "../lib/transfer";

/**
 * The connected Solana wallet as the dashboard sees it, plus the two things the
 * app asks a wallet to do: sign a message and send a transaction.
 */
export function useWallet() {
  const { address, isConnected, status, embeddedWalletInfo } = useAppKitAccount({ namespace: "solana" });
  const { walletProvider } = useAppKitProvider<Provider>("solana");
  const { walletInfo } = useWalletInfo("solana");

  /** Signs UTF-8 text; returns the base58 ed25519 signature. */
  const signMessage = useCallback(
    async (text: string) => {
      if (!walletProvider) throw new Error("Connect a wallet first.");
      const sig = await walletProvider.signMessage(new TextEncoder().encode(text));
      return bs58.encode(sig);
    },
    [walletProvider],
  );

  /** Has the wallet sign and send a transaction; returns its signature. */
  const sendTransaction = useCallback(
    async (tx: Transaction) => {
      if (!walletProvider) throw new Error("Connect a wallet first.");
      return walletProvider.sendTransaction(tx, connection());
    },
    [walletProvider],
  );

  return {
    address: isConnected ? address : undefined,
    isConnected,
    connecting: status === "connecting" || status === "reconnecting",
    chainId: SOLANA_CHAIN_ID,
    walletChain: SOLANA_CHAIN_ID,
    unsupported: false,
    connectorName: walletInfo?.name ?? null,
    loginMethod: embeddedWalletInfo?.authProvider ?? null,
    loginEmail: (embeddedWalletInfo?.user as { email?: string } | undefined)?.email ?? null,
    signMessage,
    sendTransaction,
  };
}

export function usePortfolio(chainId: number, address: string | undefined) {
  return useQuery({
    queryKey: ["portfolio", chainId, address],
    queryFn: () => loadPortfolio(chainId, address!),
    enabled: !!address,
    refetchInterval: 60_000,
  });
}

export function useActivity(chainId: number, address: string | undefined) {
  return useInfiniteQuery({
    queryKey: ["activity", chainId, address],
    queryFn: ({ pageParam }) => loadActivityPage(chainId, address!, pageParam),
    initialPageParam: null as ActivityCursor | null,
    getNextPageParam: (last) => last.cursor ?? undefined,
    enabled: !!address,
  });
}

/** Flattened activity across loaded pages. */
export const flattenActivity = (pages: { items: ActivityItem[] }[] | undefined) => pages?.flatMap((p) => p.items) ?? [];

export function useFootprint(chainId: number, address: string | undefined) {
  return useQuery({
    queryKey: ["footprint", chainId, address],
    queryFn: () => loadFootprint(chainId, address!),
    enabled: !!address,
    staleTime: 5 * 60_000,
  });
}

/** Exposure = portfolio + footprint + the first page of activity, derived during render. */
export function useExposure(chainId: number, address: string | undefined) {
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

/** Live network vitals: slot, block height, throughput and slot time. */
export function useChainStats(_chainId?: number) {
  return useQuery({ queryKey: ["chain-stats"], queryFn: loadChainStats, refetchInterval: 15_000 });
}

export function useRelayerHealth() {
  return useQuery({ queryKey: ["relayer-health"], queryFn: relayerHealth, refetchInterval: 60_000 });
}
