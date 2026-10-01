import { useMemo, useState } from "react";
import { Link } from "react-router";
import { ArrowDownLeft, Download, FileSignature } from "lucide-react";
import { chainMeta } from "../lib/chains";
import { csv, download } from "../lib/download";
import { fmtAmount, fmtDate, shortAddr } from "../lib/format";
import { useWalletData, type Authorization } from "../lib/store";
import type { ActivityItem } from "../lib/data";
import { flattenActivity, useActivity, useWallet } from "../hooks/data";
import { Badge, Card, CopyButton, Empty, ErrorNote, Notice, PageHeader, Skeleton, TxLink, type Tone } from "../ui/kit";
import { ActivityRow } from "../ui/ActivityRow";

type Tab = "chain" | "auth";
type Dir = "all" | "in" | "out";

const STATUS_TONE: Record<Authorization["status"], Tone> = {
  signed: "info",
  submitted: "warn",
  relayed: "info",
  settled: "ok",
  failed: "bad",
  expired: "muted",
};

export default function Activity() {
  const w = useWallet();
  const data = useWalletData(w.address);
  const activity = useActivity(w.chainId, w.address);
  const [tab, setTab] = useState<Tab>("chain");
  const [dir, setDir] = useState<Dir>("all");
  const [token, setToken] = useState("all");

  const items = useMemo(() => flattenActivity(activity.data?.pages), [activity.data]);
  const firstPage = activity.data?.pages[0];
  const auths = data.authorizations.filter((a) => a.chainId === w.chainId);

  const tokens = useMemo(() => {
    const m = new Map<string, string>();
    for (const i of items) if (i.token) m.set(i.token.address.toLowerCase(), i.token.symbol);
    return [...m.entries()];
  }, [items]);

  const shown = items.filter(
    (i) => (dir === "all" || i.direction === dir) && (token === "all" || i.token?.address.toLowerCase() === token),
  );

  const chain = chainMeta(w.chainId);

  function exportChain(list: ActivityItem[]) {
    download(
      `privabank-activity-${chain.short.toLowerCase().replace(/\s+/g, "-")}-${Date.now()}.csv`,
      csv([
        ["time", "type", "direction", "counterparty", "amount", "token", "status", "tx"],
        ...list.map((i) => [
          new Date(i.timestamp).toISOString(),
          i.kind,
          i.direction,
          i.counterparty ?? "",
          i.token ? fmtAmount(i.amount, i.token.decimals, i.token.decimals).replace(/,/g, "") : "0",
          i.token?.symbol ?? "",
          i.status,
          i.hash,
        ]),
      ]),
    );
  }

  function exportAuths(list: Authorization[]) {
    download(
      `privabank-authorizations-${Date.now()}.csv`,
      csv([
        ["created", "recipient", "amount", "token", "status", "settlement", "tx", "nonce", "memo"],
        ...list.map((a) => [
          new Date(a.createdAt).toISOString(),
          a.recipient,
          fmtAmount(BigInt(a.amount), a.token.decimals, a.token.decimals).replace(/,/g, ""),
          a.token.symbol,
          a.status,
          a.settlement ?? "",
          a.txHash ?? "",
          a.id,
          a.memo ?? "",
        ]),
      ]),
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Banking"
        title="Activity"
        sub={`Everything this address did on ${chain.name}, and every payment you authorized with PrivaBank.`}
      />

      <div className="tabs" role="tablist">
        <button role="tab" aria-selected={tab === "chain"} className={`tab${tab === "chain" ? " on" : ""}`} onClick={() => setTab("chain")}>
          On-chain
        </button>
        <button role="tab" aria-selected={tab === "auth"} className={`tab${tab === "auth" ? " on" : ""}`} onClick={() => setTab("auth")}>
          Authorizations <span className="tab-count">{auths.length}</span>
        </button>
      </div>

      {tab === "chain" ? (
        <Card
          title="On-chain history"
          action={
            <button type="button" className="btn btn-sec btn-sm" disabled={!shown.length} onClick={() => exportChain(shown)}>
              <Download size={14} /> Export CSV
            </button>
          }
        >
          <div className="filters">
            <div className="seg" role="group" aria-label="Direction">
              {(["all", "in", "out"] as Dir[]).map((d) => (
                <button key={d} type="button" className={dir === d ? "on" : ""} onClick={() => setDir(d)}>
                  {d === "all" ? "All" : d === "in" ? "Received" : "Sent"}
                </button>
              ))}
            </div>
            <select className="input select" value={token} onChange={(e) => setToken(e.target.value)} aria-label="Asset">
              <option value="all">All assets</option>
              {tokens.map(([addr, sym]) => (
                <option key={addr} value={addr}>
                  {sym}
                </option>
              ))}
            </select>
          </div>

          {firstPage?.source === "rpc" ? (
            <Notice tone="info">
              {chain.short}'s explorer isn't reachable from the browser, so this list is read straight from chain logs. It shows token
              transfers; plain ETH transfers appear on the{" "}
              <a href={`${chain.explorer}/address/${w.address}`} target="_blank" rel="noopener noreferrer">
                explorer
              </a>
              .
            </Notice>
          ) : null}

          {activity.isLoading ? (
            <div className="stack-8">
              {Array.from({ length: 6 }, (_, i) => (
                <Skeleton key={i} h={48} />
              ))}
            </div>
          ) : activity.error ? (
            <ErrorNote error={activity.error} />
          ) : shown.length ? (
            <ul className="rows rows--long">
              {shown.map((it) => (
                <ActivityRow key={it.id} item={it} />
              ))}
            </ul>
          ) : (
            <Empty icon={<ArrowDownLeft size={20} />} title={items.length ? "Nothing matches these filters" : "No activity yet"}>
              {items.length ? "Try a different direction or asset." : `Transfers involving this address on ${chain.short} will show up here.`}
            </Empty>
          )}

          {activity.hasNextPage ? (
            <div className="load-more">
              <button type="button" className="btn btn-sec" disabled={activity.isFetchingNextPage} onClick={() => activity.fetchNextPage()}>
                {activity.isFetchingNextPage ? "Loading…" : "Load older activity"}
              </button>
            </div>
          ) : null}
        </Card>
      ) : (
        <Card
          title="Authorizations"
          action={
            <button type="button" className="btn btn-sec btn-sm" disabled={!auths.length} onClick={() => exportAuths(auths)}>
              <Download size={14} /> Export CSV
            </button>
          }
        >
          {auths.length ? (
            <ul className="rows rows--long">
              {auths.map((a) => (
                <AuthRow key={a.id} a={a} />
              ))}
            </ul>
          ) : (
            <Empty
              icon={<FileSignature size={20} />}
              title="No authorizations yet"
              action={
                <Link className="btn btn-pri btn-sm" to="/app/pay">
                  Authorize a payment
                </Link>
              }
            >
              Payments you sign with your credential on {chain.short} are listed here, with their settlement status.
            </Empty>
          )}
        </Card>
      )}
    </>
  );
}

function AuthRow({ a }: { a: Authorization }) {
  const [open, setOpen] = useState(false);
  return (
    <li className="row row--auth">
      <button type="button" className="row-toggle" aria-expanded={open} onClick={() => setOpen((v) => !v)}>
        <span className="row-ico row-ico--out">
          <FileSignature size={16} />
        </span>
        <div className="row-main">
          <strong>
            {fmtAmount(BigInt(a.amount), a.token.decimals)} {a.token.symbol} to <span className="mono">{shortAddr(a.recipient)}</span>
          </strong>
          <span className="muted small">
            {fmtDate(a.createdAt)}
            {a.memo ? ` · ${a.memo}` : ""}
          </span>
        </div>
        <div className="row-end">
          <Badge tone={STATUS_TONE[a.status]}>{a.status}</Badge>
          {a.txHash ? <TxLink chainId={a.chainId} hash={a.txHash} /> : null}
        </div>
      </button>
      {open ? (
        <dl className="kv kv--detail">
          <div>
            <dt>Nonce</dt>
            <dd className="mono">
              {shortAddr(a.id, 12, 8)} <CopyButton value={a.id} />
            </dd>
          </div>
          <div>
            <dt>Signature</dt>
            <dd className="mono">
              {shortAddr(a.signature, 12, 8)} <CopyButton value={a.signature} />
            </dd>
          </div>
          <div>
            <dt>Credential</dt>
            <dd className="mono">{shortAddr(a.credential, 12, 8)}</dd>
          </div>
          <div>
            <dt>Settlement</dt>
            <dd>{a.settlement === "relayer" ? `Relayer${a.relayerRef ? ` (${a.relayerRef})` : ""}` : a.settlement === "wallet" ? "From wallet" : "Not settled"}</dd>
          </div>
          <div>
            <dt>Valid until</dt>
            <dd>{fmtDate(a.deadline)}</dd>
          </div>
          {a.error ? (
            <div>
              <dt>Error</dt>
              <dd>{a.error}</dd>
            </div>
          ) : null}
        </dl>
      ) : null}
    </li>
  );
}
