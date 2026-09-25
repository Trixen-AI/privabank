// Mirrors src/dashboard/lib/format.ts in the web app, with Intl formatters
// hoisted to module scope (they are expensive to build on every render).
import { formatUnits } from "viem";

const usdWhole = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });
const usdCents = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 2 });
const intFmt = new Intl.NumberFormat("en-US");
const amountFmt = [0, 1, 2, 3, 4, 5, 6].map((d) => new Intl.NumberFormat("en-US", { maximumFractionDigits: d }));
const dayFmt = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" });
const dateTimeFmt = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

export const shortAddr = (a: string | undefined | null, head = 6, tail = 4) =>
  a ? `${a.slice(0, head)}…${a.slice(-tail)}` : "";

/** Human amount with sensible precision: more decimals for small values. */
export function fmtAmount(raw: bigint, decimals: number, maxFrac?: number) {
  const n = Number(formatUnits(raw, decimals));
  if (n === 0) return "0";
  const frac = maxFrac ?? (Math.abs(n) >= 1000 ? 2 : Math.abs(n) >= 1 ? 4 : 6);
  if (Math.abs(n) < 10 ** -frac) return `<${(10 ** -frac).toFixed(frac)}`;
  return amountFmt[Math.min(frac, 6)].format(n);
}

export const fmtUsd = (n: number | null | undefined) => (n == null ? "–" : (n >= 1000 ? usdWhole : usdCents).format(n));

export const fmtInt = (n: number | bigint) => intFmt.format(Number(n));

export function fmtAgo(ms: number, now = Date.now()) {
  const s = Math.round((now - ms) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 45) return `${d}d ago`;
  return dayFmt.format(ms);
}

export const fmtDate = (ms: number) => dateTimeFmt.format(ms);

export const sameAddr = (a?: string | null, b?: string | null) => !!a && !!b && a.toLowerCase() === b.toLowerCase();

export const lower = (a: string) => a.toLowerCase();
