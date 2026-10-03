/** Raw integer units to a decimal string, without float rounding. */
export function formatUnits(raw: bigint, decimals: number) {
  const neg = raw < 0n;
  const s = (neg ? -raw : raw).toString().padStart(decimals + 1, "0");
  const int = s.slice(0, s.length - decimals) || "0";
  const frac = decimals ? s.slice(-decimals).replace(/0+$/, "") : "";
  return `${neg ? "-" : ""}${int}${frac ? `.${frac}` : ""}`;
}

/** Decimal string to raw integer units; throws on more decimals than the token has. */
export function parseUnits(value: string, decimals: number) {
  const [int, frac = ""] = value.trim().split(".");
  if (frac.length > decimals) throw new Error("Too many decimals");
  return BigInt((int || "0") + frac.padEnd(decimals, "0"));
}

export const shortAddr = (a: string | undefined | null, head = 4, tail = 4) =>
  a ? `${a.slice(0, head)}…${a.slice(-tail)}` : "";

/** Human amount with sensible precision: more decimals for small values. */
export function fmtAmount(raw: bigint, decimals: number, maxFrac?: number) {
  const n = Number(formatUnits(raw, decimals));
  if (n === 0) return "0";
  const frac = maxFrac ?? (Math.abs(n) >= 1000 ? 2 : Math.abs(n) >= 1 ? 4 : 6);
  if (Math.abs(n) < 10 ** -frac) return `<${(10 ** -frac).toFixed(frac)}`;
  return n.toLocaleString("en-US", { maximumFractionDigits: frac });
}

export const fmtUsd = (n: number | null | undefined) =>
  n == null
    ? "–"
    : n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: n >= 1000 ? 0 : 2 });

export const fmtInt = (n: number | bigint) => Number(n).toLocaleString("en-US");

export function fmtAgo(ms: number, now = Date.now()) {
  const s = Math.round((now - ms) / 1000);
  if (s < 45) return "just now";
  const m = Math.round(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.round(m / 60);
  if (h < 36) return `${h}h ago`;
  const d = Math.round(h / 24);
  if (d < 45) return `${d}d ago`;
  return new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export const fmtDate = (ms: number) =>
  new Date(ms).toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "2-digit", minute: "2-digit" });

export const fmtDay = (ms: number) =>
  new Date(ms).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });

/** Solana addresses are case-sensitive: compare exactly. */
export const sameAddr = (a?: string | null, b?: string | null) => !!a && !!b && a === b;
