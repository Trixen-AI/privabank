import { ArrowDownLeft, ArrowUpRight, Repeat, SquareFunction } from "lucide-react";
import type { ActivityItem } from "../lib/data";
import { addressUrl } from "../lib/chains";
import { fmtAgo, fmtAmount, shortAddr } from "../lib/format";
import { Badge, TxLink } from "./kit";

/** One on-chain movement: direction, counterparty, amount, time, explorer link. */
export function ActivityRow({ item }: { item: ActivityItem }) {
  const icon =
    item.kind === "call" ? <SquareFunction size={16} /> : item.direction === "in" ? <ArrowDownLeft size={16} /> : item.direction === "out" ? <ArrowUpRight size={16} /> : <Repeat size={16} />;
  const title =
    item.kind === "call"
      ? (item.method ?? "Program call")
      : item.direction === "in"
        ? "Received"
        : item.direction === "out"
          ? "Sent"
          : "Self transfer";
  return (
    <li className="row">
      <span className={`row-ico row-ico--${item.kind === "call" ? "call" : item.direction}`}>{icon}</span>
      <div className="row-main">
        <strong>{title}</strong>
        <span className="muted small">
          {item.counterparty ? (
            <>
              {item.direction === "in" ? "from " : "to "}
              <a className="mono" href={addressUrl(item.chainId, item.counterparty)} target="_blank" rel="noopener noreferrer">
                {shortAddr(item.counterparty)}
              </a>
            </>
          ) : item.kind === "call" ? (
            "program interaction"
          ) : (
            "no direct counterparty"
          )}
          {" · "}
          {item.timestamp ? fmtAgo(item.timestamp) : "time unknown"}
        </span>
      </div>
      <div className="row-end">
        {item.token && item.amount > 0n ? (
          <span className={`amt amt--${item.direction}`}>
            {item.direction === "out" ? "−" : item.direction === "in" ? "+" : ""}
            {fmtAmount(item.amount, item.token.decimals)} {item.token.symbol}
          </span>
        ) : null}
        {item.status !== "success" ? <Badge tone={item.status === "failed" ? "bad" : "warn"}>{item.status}</Badge> : null}
        <TxLink chainId={item.chainId} hash={item.hash} />
      </div>
    </li>
  );
}
