import { lazy, Suspense } from "react";
import { Route, Routes } from "react-router";
import { QueryClientProvider } from "@tanstack/react-query";
import { useAppKit } from "@reown/appkit/react";
import { queryClient } from "./wallet/config";
import { useWallet } from "./hooks/data";
import { Shell } from "./layout/Shell";
import { ConnectGate } from "./layout/Gates";
import { ToastProvider } from "./ui/Toasts";
import { Skeleton } from "./ui/kit";

// One chunk per page: the Overview doesn't ship the audit verifier, and so on.
const Overview = lazy(() => import("./pages/Overview"));
const Pay = lazy(() => import("./pages/Pay"));
const Activity = lazy(() => import("./pages/Activity"));
const Credential = lazy(() => import("./pages/Credential"));
const Privacy = lazy(() => import("./pages/Privacy"));
const Controls = lazy(() => import("./pages/Controls"));
const Settings = lazy(() => import("./pages/Settings"));
const NotFound = lazy(() => import("./pages/NotFound"));

const pageFallback = (
  <div className="stack-16" aria-busy="true">
    <Skeleton h={40} w={280} />
    <Skeleton h={180} />
    <Skeleton h={140} />
  </div>
);

function Routed() {
  const w = useWallet();
  const { open } = useAppKit();

  if (!w.isConnected) return <ConnectGate onConnect={() => open()} connecting={w.connecting} />;

  return (
    <Shell>
      {/* key: switching wallet remounts pages so no state leaks between accounts */}
      <Suspense fallback={pageFallback} key={w.address}>
        <Routes>
          <Route index element={<Overview />} />
          <Route path="pay" element={<Pay />} />
          <Route path="activity" element={<Activity />} />
          <Route path="credential" element={<Credential />} />
          <Route path="privacy" element={<Privacy />} />
          <Route path="controls" element={<Controls />} />
          <Route path="settings" element={<Settings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </Shell>
  );
}

export default function WalletRoot() {
  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider>
        <Routed />
      </ToastProvider>
    </QueryClientProvider>
  );
}
