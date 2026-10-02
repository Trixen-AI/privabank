import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import App from "./App";

// The dashboard (wallet stack, viem, AppKit) loads only when someone opens /app.
const DashboardApp = lazy(() => import("./dashboard/DashboardApp"));

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<App />} />
        <Route
          path="/app/*"
          element={
            <Suspense fallback={<div className="app-loading" aria-busy="true">Loading Spectral…</div>}>
              <DashboardApp />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
