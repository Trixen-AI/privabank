import { createAppKit } from "@reown/appkit/react";
import { WagmiAdapter } from "@reown/appkit-adapter-wagmi";
import { mainnet, robinhood, type AppKitNetwork } from "@reown/appkit/networks";
import { QueryClient } from "@tanstack/react-query";
import { REOWN_PROJECT_ID } from "../lib/env";

/**
 * Wallet layer. Created once, at module load, as Reown's docs require:
 * createAppKit must run outside React, before any hook reads it.
 *
 * Robinhood Chain first (it is where CassaFi settles), then Ethereum. Email and social login are on because that *is* the product's
 * "ZK Login": a user signs in with Google or email and never sees a seed phrase.
 */
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [robinhood, mainnet];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

// ssr: true makes wagmi reconnect in an effect after mount. Without it, wagmi's
// <Hydrate> reconnects during render and React warns that the account hooks
// updated while another component was rendering.
export const wagmiAdapter = new WagmiAdapter({ networks, projectId: REOWN_PROJECT_ID, ssr: true });

createAppKit({
  adapters: [wagmiAdapter],
  networks,
  defaultNetwork: robinhood,
  projectId: REOWN_PROJECT_ID,
  metadata: {
    name: "CassaFi",
    description: "Privacy-first, authorization-based onchain neobank.",
    url: typeof window !== "undefined" ? window.location.origin : "https://cassafi.money",
    icons: [typeof window !== "undefined" ? `${window.location.origin}/brand/logo-500.png` : ""],
  },
  features: {
    email: true,
    socials: ["google", "apple", "x", "github", "discord"],
    emailShowWallets: true,
    analytics: false,
    swaps: false,
    onramp: false,
  },
  themeMode: "light",
  themeVariables: {
    "--w3m-accent": "#0b8a66",
    "--w3m-color-mix": "#0b8a66",
    "--w3m-color-mix-strength": 6,
    "--w3m-font-family": '"General Sans", -apple-system, "Helvetica Neue", Arial, sans-serif',
    "--w3m-border-radius-master": "2px",
    "--w3m-z-index": 1000,
  },
});
