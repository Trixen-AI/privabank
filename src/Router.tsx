import { lazy, Suspense } from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router";
import SiteApp from "./site/SiteApp";

// The dashboard (wallet stack, viem, AppKit) loads only when someone opens /app.
const DashboardApp = lazy(() => import("./dashboard/DashboardApp"));

export function Router() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<SiteApp />} />
        <Route
          path="/app/*"
          element={
            <Suspense fallback={<div className="app-loading" aria-busy="true">Loading CassaFi…</div>}>
              <DashboardApp />
            </Suspense>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
