import { lazy, Suspense } from "react";
import { REOWN_PROJECT_ID } from "./lib/env";
import { SetupRequired } from "./layout/Gates";
import "./dashboard.css";

/**
 * Entry for everything under /app. The wallet stack (AppKit, wagmi, viem) is
 * only loaded here, so the marketing site never pays for it. Without a Reown
 * project ID there is nothing to connect with, so we explain the setup instead
 * of letting AppKit throw.
 */
const WalletRoot = lazy(() => import("./WalletRoot"));

/** React 19 hoists these into <head>: the app has its own title and stays out of search results. */
const appHead = (
  <>
    <title>CassaFi App</title>
    <meta name="robots" content="noindex, nofollow" />
  </>
);

export default function DashboardApp() {
  if (!REOWN_PROJECT_ID)
    return (
      <>
        {appHead}
        <SetupRequired />
      </>
    );
  return (
    <>
      {appHead}
      <Suspense fallback={<div className="app-loading" aria-busy="true">Loading CassaFi…</div>}>
        <WalletRoot />
      </Suspense>
    </>
  );
}
