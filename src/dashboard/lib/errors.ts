/** Turns wallet/viem errors into one readable line (user rejections stay short). */
export function humanError(e: unknown): string {
  const err = e as { shortMessage?: string; message?: string };
  const msg = err?.shortMessage ?? err?.message ?? String(e);
  if (/user rejected|denied|rejected the request|user cancel/i.test(msg)) return "You declined the request in your wallet.";
  return msg.split("\n")[0].slice(0, 220);
}

export const isUserRejection = (e: unknown) => /declined the request/.test(humanError(e));
