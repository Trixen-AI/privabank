// Must stay the first import: installs the crypto, URL and event polyfills
// WalletConnect expects on React Native.
import "@walletconnect/react-native-compat";

import * as Clipboard from "expo-clipboard";
import { createAppKit } from "@reown/appkit-react-native";
import { WagmiAdapter } from "@reown/appkit-wagmi-react-native";
import { mainnet, robinhood } from "viem/chains";
import { REOWN_PROJECT_ID } from "@/lib/env";
import { appKitStorage } from "./storage";
import { colors } from "@/theme/tokens";

/**
 * Wallet connection: Reown AppKit with the wagmi adapter, so signing and
 * sending use the same wagmi hooks as the web app. Robinhood Chain first (it
 * is where CassaFi settles), then Ethereum. Email and social login open
 * Reown's web wallet in the browser and come back over WalletConnect.
 *
 * Without a project ID there is nothing to connect with; the app shows a
 * setup screen instead of creating AppKit.
 */
const networks = [robinhood, mainnet] as const;

export const wagmiAdapter = REOWN_PROJECT_ID ? new WagmiAdapter({ projectId: REOWN_PROJECT_ID, networks: [...networks] }) : null;

export const appKit: ReturnType<typeof createAppKit> | null =
  REOWN_PROJECT_ID && wagmiAdapter
    ? createAppKit({
        projectId: REOWN_PROJECT_ID,
        networks: [...networks],
        defaultNetwork: robinhood,
        adapters: [wagmiAdapter],
        storage: appKitStorage,
        clipboardClient: { setString: async (value: string) => void (await Clipboard.setStringAsync(value)) },
        metadata: {
          name: "CassaFi",
          description: "The onchain neobank that runs on permission.",
          url: "https://cassafi.money",
          icons: ["https://cassafi.money/brand/logo-500.png"],
          redirect: { native: "cassafi://" },
        },
        themeMode: "dark",
        themeVariables: { accent: colors.accent },
        features: { swaps: false, onramp: false, socials: ["email", "google", "apple", "x", "discord"] },
        enableAnalytics: false,
      })
    : null;
