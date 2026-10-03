import { createAppKit } from "@reown/appkit/react";
import { SolanaAdapter } from "@reown/appkit-adapter-solana/react";
import { solana, type AppKitNetwork } from "@reown/appkit/networks";
import { QueryClient } from "@tanstack/react-query";
import { REOWN_PROJECT_ID } from "../lib/env";

/**
 * Wallet layer. Created once, at module load, as Reown's docs require:
 * createAppKit must run outside React, before any hook reads it.
 *
 * Solana mainnet only. Installed Solana wallets (Phantom, Solflare, Backpack...)
 * are found through the Wallet Standard; others connect over WalletConnect.
 * Email and social login are on because that *is* the product's "ZK Login": a
 * user signs in with Google or email and never sees a seed phrase.
 */
export const networks: [AppKitNetwork, ...AppKitNetwork[]] = [solana];

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30_000, refetchOnWindowFocus: false, retry: 1 },
  },
});

export const solanaAdapter = new SolanaAdapter();

createAppKit({
  adapters: [solanaAdapter],
  networks,
  defaultNetwork: solana,
  projectId: REOWN_PROJECT_ID,
  metadata: {
    name: "Spectral",
    description: "Privacy-first, authorization-based onchain neobank on Solana.",
    url: typeof window !== "undefined" ? window.location.origin : "https://spectral.money",
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
  themeMode: "dark",
  themeVariables: {
    "--w3m-accent": "#b600ff",
    "--w3m-color-mix": "#050507",
    "--w3m-color-mix-strength": 6,
    "--w3m-font-family": '"General Sans", -apple-system, "Helvetica Neue", Arial, sans-serif',
    "--w3m-border-radius-master": "2px",
    "--w3m-z-index": 1000,
  },
});
