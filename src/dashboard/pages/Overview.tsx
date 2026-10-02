import { Link } from "react-router";
import { useAppKit } from "@reown/appkit/react";
import { ArrowDownLeft, ArrowUpRight, BadgeCheck, Eye, Send } from "lucide-react";
import { formatGwei, formatUnits } from "viem";
import { chainMeta } from "../lib/chains";
import { fmtAgo, fmtAmount, fmtInt, fmtUsd, shortAddr } from "../lib/format";
import { spentToday } from "../lib/protocol";
import { useWalletData, type WalletData } from "../lib/store";
import { flattenActivity, useActivity, useChainStats, useExposure, usePortfolio, useRelayerHealth, useWallet } from "../hooks/data";
import type { Holding, Portfolio } from "../lib/data";
import { AddressChip, Badge, Card, Empty, ErrorNote, Meter, Notice, PageHeader, Skeleton, TokenAvatar } from "../ui/kit";
import { ExposureGauge } from "../ui/ExposureGauge";
import { ActivityRow } from "../ui/ActivityRow";
import { RELAYER_URL } from "../lib/env";
import { deriveCard } from "../lib/card";
import { BankCard } from "../ui/BankCard";

export default function Overview() {
  const w = useWallet();
  const data = useWalletData(w.address);
  const portfolio = usePortfolio(w.chainId, w.address);
  const activity = useActivity(w.chainId, w.address);
  const { exposure, loading: exposureLoading } = useExposure(w.chainId, w.address);
  const chain = chainMeta(w.chainId);
  const recent = flattenActivity(activity.data?.pages).slice(0, 6);

  return (
    <>
      <PageHeader
        eyebrow="Overview"
        title="Your account"
        sub={
          <>
            {w.address ? <AddressChip address={w.address} chainId={w.chainId} /> : null} on {chain.name}
          </>
        }
        actions={
          <Link className="btn btn-pri" to="/app/pay">
            <Send size={16} /> Authorize payment
          </Link>
        }
      />

      <UnsupportedNetwork />

      <div className="ov-top">
        <BalanceHero portfolio={portfolio.data} loading={portfolio.isLoading} error={portfolio.error} chainName={chain.name} isTestnet={chain.testnet} />
        <CredentialCard data={data} chainId={w.chainId} />
      </div>

      <div className="g-3">
        <LimitsCard data={data} chainId={w.chainId} holdings={portfolio.data?.holdings ?? []} />
        <Card label="Privacy" title="Public exposure" action={<Link to="/app/privacy">Full report</Link>}>
          {exposure ? (
            <div className="ov-exposure">
              <ExposureGauge score={exposure.score} level={exposure.level} size={148} />
              <p className="muted">
                What a stranger can learn from this address on {chain.short}. Scored from your balance, history and counterparties.
              </p>
            </div>
          ) : exposureLoading ? (
            <Skeleton h={120} />
          ) : (
            <p className="muted">Exposure is calculated once your balance and history load.</p>
          )}
        </Card>
        <NetworkCard chainId={w.chainId} />
      </div>

      <Card
        label="Activity"
        title="Recent on-chain activity"
        action={<Link to="/app/activity">View all</Link>}
      >
        {activity.isLoading ? (
          <div className="stack-8">
            <Skeleton h={44} />
            <Skeleton h={44} />
            <Skeleton h={44} />
          </div>
        ) : activity.error ? (
          <ErrorNote error={activity.error} />
        ) : recent.length ? (
          <ul className="rows">
            {recent.map((it) => (
              <ActivityRow key={it.id} item={it} />
            ))}
          </ul>
        ) : (
          <Empty title="No activity yet" icon={<ArrowDownLeft size={20} />}>
            Transfers to and from this address on {chain.short} will appear here.
          </Empty>
        )}
      </Card>
    </>
  );
}

function UnsupportedNetwork() {
  const w = useWallet();
  const { open } = useAppKit();
  if (!w.unsupported) return null;
  return (
    <Notice tone="warn" action={<button className="btn btn-sec btn-sm" onClick={() => open({ view: "Networks" })}>Switch network</button>}>
      Your wallet is on a network Spectral doesn't run on. Showing Robinhood Chain until you switch.
    </Notice>
  );
}

function BalanceHero({
  portfolio,
  loading,
  error,
  chainName,
  isTestnet,
}: {
  portfolio: Portfolio | undefined;
  loading: boolean;
  error: unknown;
  chainName: string;
  isTestnet: boolean;
}) {
  const held = portfolio?.holdings.filter((h) => h.raw > 0n) ?? [];
  return (
    <section className="panel panel--accent ov-hero">
      <div className="panel__dots" />
      <div className="panel__inner">
        <div className="ov-hero-head">
          <span className="ds-label">Wallet balance</span>
          <span className="hero-chip">
            <Eye size={13} /> Public on {chainName}
          </span>
        </div>
        {loading ? (
          <div className="ov-hero-skel">
            <Skeleton h={48} w={220} />
          </div>
        ) : error ? (
          <p className="ov-hero-err">{(error as Error).message}</p>
        ) : (
          <>
            {/* With a market price, lead with USD. Without one (testnets, illiquid tokens),
                lead with the main balance itself rather than an empty dollar figure. */}
            <div className="ov-hero-total">
              {portfolio && portfolio.totalUsd > 0
                ? fmtUsd(portfolio.totalUsd)
                : held.length
                  ? `${fmtAmount(held[0].raw, held[0].decimals)} ${held[0].symbol}`
                  : "$0.00"}
            </div>
            <p className="ov-hero-sub">
              {held.length} asset{held.length === 1 ? "" : "s"}
              {portfolio && portfolio.totalUsd === 0 && held.length
                ? isTestnet
                  ? " · testnet assets have no market price"
                  : " · no reliable market price"
                : portfolio && portfolio.unpriced > 0
                  ? ` · ${portfolio.unpriced} without a reliable price`
                  : ""}
              {portfolio?.source === "rpc" ? " · read from chain logs" : ""}
            </p>
            <ul className="ov-hero-assets">
              {held.slice(0, 4).map((h) => (
                <HeroAsset key={h.token} h={h} />
              ))}
              {held.length > 4 ? <li className="more">+{held.length - 4} more</li> : null}
            </ul>
          </>
        )}
        <div className="ov-hero-cta">
          <Link className="btn btn-pri" to="/app/pay">
            <ArrowUpRight size={16} /> Pay
          </Link>
          <Link className="btn btn-glass" to="/app/privacy">
            See what's exposed
          </Link>
        </div>
      </div>
    </section>
  );
}

function HeroAsset({ h }: { h: Holding }) {
  return (
    <li>
      <TokenAvatar symbol={h.symbol} address={h.token} icon={h.icon} size={26} />
      <span>
        <strong>{fmtAmount(h.raw, h.decimals)}</strong> {h.symbol}
      </span>
    </li>
  );
}

function CredentialCard({ data, chainId }: { data: WalletData; chainId: number }) {
  const c = data.credential;
  return (
    <Card label="Your card" title={c ? (c.holderName ? "Active" : "Credential issued") : "Not issued yet"} className="ov-cred">
      {c ? (
        <>
          {c.holderName ? (
            <BankCard card={deriveCard(c.id, c.issuedAt)} holder={c.holderName} size="sm" controls={false} />
          ) : (
            <p className="muted">
              Payments are authorized with credential <span className="mono">{shortAddr(c.id, 10, 6)}</span>.
            </p>
          )}
          <dl className="kv">
            <div>
              <dt>Network</dt>
              <dd>{chainMeta(c.chainId).name}</dd>
            </div>
            <div>
              <dt>Issued</dt>
              <dd>{fmtAgo(c.issuedAt)}</dd>
            </div>
          </dl>
          {c.chainId !== chainId ? <Badge tone="warn">Issued on another network</Badge> : <Badge tone="ok">Active</Badge>}
          <Link className="card-link" to="/app/credential">
            Card & credential
          </Link>
        </>
      ) : (
        <>
          <p className="muted">Add your name and sign once to get your Spectral card. Signing doesn't move funds.</p>
          <Link className="btn btn-pri btn-sm" to="/app/credential">
            <BadgeCheck size={15} /> Get your card
          </Link>
        </>
      )}
    </Card>
  );
}

function LimitsCard({ data, chainId, holdings }: { data: WalletData; chainId: number; holdings: Holding[] }) {
  // A limit's token comes from current holdings, or from past authorizations if it has since been spent down.
  const known = new Map<string, { symbol: string; decimals: number; address: string }>();
  for (const a of data.authorizations) known.set(a.token.address.toLowerCase(), a.token);
  for (const h of holdings) known.set(h.token.toLowerCase(), { symbol: h.symbol, decimals: h.decimals, address: h.token });

  const rows = Object.entries(data.policy.dailyLimits)
    .filter(([k]) => k.startsWith(`${chainId}:`))
    .flatMap(([k, cap]) => {
      const tok = known.get(k.split(":")[1]);
      if (!tok) return [];
      const used = spentToday(data, chainId, tok.address as `0x${string}`);
      return [{ ...tok, used, cap }];
    });

  return (
    <Card label="Spending" title="Today's limits" action={<Link to="/app/controls">Edit</Link>}>
      {rows.length ? (
        <ul className="limit-list">
          {rows.map((r) => (
            <li key={r.address}>
              <div className="limit-row">
                <span>{r.symbol}</span>
                <span className="mono">
                  {fmtAmount(r.used, r.decimals)} / {r.cap}
                </span>
              </div>
              <Meter value={Number(formatUnits(r.used, r.decimals))} max={Number(r.cap)} />
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted">
          No daily limits on this network. <Link to="/app/controls">Set one</Link> so a single authorization can never drain an account.
        </p>
      )}
    </Card>
  );
}

function NetworkCard({ chainId }: { chainId: number }) {
  const stats = useChainStats(chainId);
  const relayer = useRelayerHealth();
  const chain = chainMeta(chainId);
  return (
    <Card label="Network" title={chain.name}>
      <dl className="kv">
        <div>
          <dt>Latest block</dt>
          <dd className="mono">{stats.data ? fmtInt(stats.data.head) : "…"}</dd>
        </div>
        <div>
          <dt>Gas price</dt>
          <dd className="mono">{stats.data ? `${Number(formatGwei(stats.data.gasPrice)).toPrecision(3)} gwei` : "…"}</dd>
        </div>
        <div>
          <dt>Block time</dt>
          <dd className="mono">{stats.data?.blockTime ? `${stats.data.blockTime.toFixed(2)}s` : "…"}</dd>
        </div>
        <div>
          <dt>Relayer</dt>
          <dd>
            {!RELAYER_URL ? (
              <Badge tone="muted">Wallet settlement</Badge>
            ) : relayer.data?.ok ? (
              <Badge tone="ok">Online</Badge>
            ) : (
              <Badge tone="bad">{relayer.data?.detail ?? "Checking"}</Badge>
            )}
          </dd>
        </div>
      </dl>
      {stats.error ? <p className="muted small">Couldn't reach the {chain.short} RPC.</p> : null}
    </Card>
  );
}
