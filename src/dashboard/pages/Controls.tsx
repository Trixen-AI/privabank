import { useMemo, useState } from "react";
import { Link } from "react-router";
import { useQuery } from "@tanstack/react-query";
import { useSignMessage, useSwitchChain } from "wagmi";
import { formatUnits, getAddress, isAddress, keccak256, toBytes } from "viem";
import { normalize } from "viem/ens";
import { CheckCircle2, Download, FileCheck2, Plus, Send, ShieldAlert, Trash2, Upload, XCircle } from "lucide-react";
import { chainMeta } from "../lib/chains";
import { publicClient } from "../lib/clients";
import { download } from "../lib/download";
import { humanError } from "../lib/errors";
import { fmtAmount, fmtDate, fmtDay, shortAddr } from "../lib/format";
import {
  buildAuditReport,
  parseAmount,
  reportDigest,
  reportMessage,
  spentToday,
  verifyAuditFile,
  type AuditVerification,
  type SignedAuditFile,
} from "../lib/protocol";
import { addReport, limitKey, removeReport, setPolicy, useWalletData, type WalletData } from "../lib/store";
import type { Holding } from "../lib/data";
import { flattenActivity, useActivity, usePortfolio, useWallet } from "../hooks/data";
import { Badge, Card, Empty, Meter, Notice, PageHeader, TokenAvatar } from "../ui/kit";
import { useToast } from "../ui/toast-context";

export default function Controls() {
  const w = useWallet();
  const data = useWalletData(w.address);
  const portfolio = usePortfolio(w.chainId, w.address);

  return (
    <>
      <PageHeader
        eyebrow="Privacy & control"
        title="Spending controls"
        sub="The rules your credential enforces before it signs anything, and the reports that prove it to an auditor."
      />
      <div className="controls-grid">
        <Limits data={data} chainId={w.chainId} address={w.address!} holdings={portfolio.data?.holdings ?? []} loading={portfolio.isLoading} />
        <Merchants data={data} chainId={w.chainId} address={w.address!} />
      </div>
      <Reports data={data} chainId={w.chainId} address={w.address!} />
      <VerifyReport />
    </>
  );
}

/* ------------------------------------------------------------ daily limits */

function Limits({
  data,
  chainId,
  address,
  holdings,
  loading,
}: {
  data: WalletData;
  chainId: number;
  address: string;
  holdings: Holding[];
  loading: boolean;
}) {
  const toast = useToast();
  // Tokens you hold, plus any token that already has a limit (even if spent to zero).
  const rows = useMemo(() => {
    const m = new Map<string, { address: `0x${string}`; symbol: string; decimals: number; icon: string | null }>();
    for (const a of data.authorizations)
      if (a.chainId === chainId) m.set(a.token.address.toLowerCase(), { ...a.token, icon: null });
    for (const h of holdings)
      if (h.raw > 0n) m.set(h.token.toLowerCase(), { address: h.token, symbol: h.symbol, decimals: h.decimals, icon: h.icon });
    return [...m.values()].slice(0, 12);
  }, [holdings, data.authorizations, chainId]);

  return (
    <Card label="Rule 1" title="Daily spending limits">
      <p className="muted">A rolling 24-hour cap per asset. Authorizations that would pass it are refused before you sign.</p>
      {loading ? (
        <p className="muted">Loading your assets…</p>
      ) : rows.length ? (
        <ul className="limit-edit">
          {rows.map((t) => (
            <LimitRow
              key={t.address}
              token={t}
              cap={data.policy.dailyLimits[limitKey(chainId, t.address)] ?? ""}
              used={spentToday(data, chainId, t.address)}
              onSave={(v) => {
                setPolicy(address, (p) => {
                  const next = { ...p.dailyLimits };
                  if (v) next[limitKey(chainId, t.address)] = v;
                  else delete next[limitKey(chainId, t.address)];
                  return { ...p, dailyLimits: next };
                });
                toast({ tone: "ok", title: v ? `Daily ${t.symbol} limit set to ${v}` : `${t.symbol} limit removed` });
              }}
            />
          ))}
        </ul>
      ) : (
        <Empty title="No assets to limit yet">Limits appear for every asset this address holds on {chainMeta(chainId).short}.</Empty>
      )}
    </Card>
  );
}

function LimitRow({
  token,
  cap,
  used,
  onSave,
}: {
  token: { address: `0x${string}`; symbol: string; decimals: number; icon: string | null };
  cap: string;
  used: bigint;
  onSave: (v: string) => void;
}) {
  const [value, setValue] = useState(cap);
  const dirty = value.trim() !== cap;
  const valid = value.trim() === "" || parseAmount(value, token.decimals) != null;
  return (
    <li>
      <div className="limit-edit-row">
        <TokenAvatar symbol={token.symbol} address={token.address} icon={token.icon} size={28} />
        <strong>{token.symbol}</strong>
        <div className="input-group input-group--sm">
          <input
            className={`input mono${valid ? "" : " input--bad"}`}
            inputMode="decimal"
            placeholder="No limit"
            value={value}
            onChange={(e) => setValue(e.target.value.replace(",", "."))}
            aria-label={`Daily ${token.symbol} limit`}
          />
          <button type="button" className="btn btn-sec btn-sm" disabled={!dirty || !valid} onClick={() => onSave(value.trim())}>
            Save
          </button>
        </div>
      </div>
      {cap ? (
        <div className="limit-used">
          <Meter value={Number(formatUnits(used, token.decimals))} max={Number(cap)} />
          <span className="muted small mono">
            {fmtAmount(used, token.decimals)} of {cap} used today
          </span>
        </div>
      ) : null}
    </li>
  );
}

/* ------------------------------------------------------------ merchants */

function Merchants({ data, chainId, address }: { data: WalletData; chainId: number; address: string }) {
  const [input, setInput] = useState("");
  const [label, setLabel] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const ensName = input.trim().toLowerCase().endsWith(".eth") ? input.trim().toLowerCase() : null;
  const ens = useQuery({
    queryKey: ["ens", ensName],
    queryFn: () => publicClient(1).getEnsAddress({ name: normalize(ensName!) }),
    enabled: !!ensName,
  });
  const resolved = ensName ? ens.data ?? null : isAddress(input.trim()) ? getAddress(input.trim()) : null;

  function add(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    if (!resolved) return setErr(ensName ? "That name doesn't resolve." : "Enter a valid address or ENS name.");
    if (data.policy.merchants.some((m) => m.address.toLowerCase() === resolved.toLowerCase())) return setErr("Already on your list.");
    setPolicy(address, (p) => ({
      ...p,
      merchants: [{ address: resolved, label: label.trim() || ensName || shortAddr(resolved), addedAt: Date.now() }, ...p.merchants],
    }));
    setInput("");
    setLabel("");
  }

  return (
    <Card
      label="Rule 2"
      title="Merchant allowlist"
      action={
        <label className="toggle">
          <input
            type="checkbox"
            checked={data.policy.allowlistOnly}
            onChange={(e) => setPolicy(address, (p) => ({ ...p, allowlistOnly: e.target.checked }))}
          />
          <span className="toggle-track" aria-hidden="true" />
          <span className="toggle-label">Allowlist only</span>
        </label>
      }
    >
      <p className="muted">
        {data.policy.allowlistOnly
          ? "Only these recipients can be paid. Anything else is refused before signing."
          : "Recipients you trust. Paying anyone else shows a warning; turn on allowlist-only to block them."}
      </p>

      <form className="merchant-form" onSubmit={add}>
        <input className="input mono" placeholder="0x… or name.eth" value={input} onChange={(e) => setInput(e.target.value)} aria-label="Merchant address" />
        <input className="input" placeholder="Label" value={label} maxLength={40} onChange={(e) => setLabel(e.target.value)} aria-label="Merchant label" />
        <button type="submit" className="btn btn-pri btn-sm" disabled={!input.trim()}>
          <Plus size={15} /> Add
        </button>
      </form>
      {ensName && ens.data ? <span className="field-hint">Resolves to {shortAddr(ens.data)}</span> : null}
      {err ? <p className="field-err">{err}</p> : null}

      {data.policy.merchants.length ? (
        <ul className="merchant-list">
          {data.policy.merchants.map((m) => (
            <li key={m.address}>
              <div>
                <strong>{m.label}</strong>
                <span className="muted small mono">{shortAddr(m.address)}</span>
              </div>
              <Link className="icon-btn" to={`/app/pay?to=${m.address}`} aria-label={`Pay ${m.label}`} title="Pay">
                <Send size={15} />
              </Link>
              <button
                type="button"
                className="icon-btn"
                aria-label={`Remove ${m.label}`}
                title="Remove"
                onClick={() => setPolicy(address, (p) => ({ ...p, merchants: p.merchants.filter((x) => x.address !== m.address) }))}
              >
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="muted small">No merchants yet on {chainMeta(chainId).short}.</p>
      )}
    </Card>
  );
}

/* ------------------------------------------------------------ audit reports */

const RANGES = [
  { key: "7", label: "7 days", days: 7 },
  { key: "30", label: "30 days", days: 30 },
  { key: "90", label: "90 days", days: 90 },
];

function Reports({ data, chainId, address }: { data: WalletData; chainId: number; address: string }) {
  const [range, setRange] = useState("30");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const activity = useActivity(chainId, address as `0x${string}`);
  const { signMessageAsync } = useSignMessage();
  const { switchChainAsync } = useSwitchChain();
  const w = useWallet();
  const toast = useToast();
  const reports = data.reports.filter((r) => r.chainId === chainId);

  async function generate() {
    setBusy(true);
    setErr(null);
    try {
      const to = Date.now();
      const from = to - RANGES.find((r) => r.key === range)!.days * 86_400_000;

      // Load older history until the period is covered (bounded, so a huge account can't stall this).
      let pages = activity.data?.pages ?? [];
      let hasMore = activity.hasNextPage;
      for (let i = 0; i < 8 && hasMore; i++) {
        const oldest = Math.min(...flattenActivity(pages).map((x) => x.timestamp));
        if (oldest < from) break;
        const res = await activity.fetchNextPage();
        pages = res.data?.pages ?? pages;
        hasMore = res.hasNextPage;
      }

      const report = buildAuditReport(data, { holder: getAddress(address), chainId, from, to, activity: flattenActivity(pages) });
      const digest = reportDigest(report);
      const message = reportMessage(report, digest);
      if (w.walletChain !== chainId) await switchChainAsync({ chainId });
      const signature = await signMessageAsync({ message });
      const file: SignedAuditFile = { report, digest, message, signature };
      const text = JSON.stringify(file, null, 2);
      addReport(address, {
        id: keccak256(toBytes(`${digest}${signature}`)).slice(0, 18),
        chainId,
        from,
        to,
        createdAt: Date.now(),
        entries: report.authorizations.length + report.settlements.length,
        digest,
        signature,
        file: text,
      });
      download(`spectral-audit-${fmtDay(from).replace(/[ ,]+/g, "-")}-to-${fmtDay(to).replace(/[ ,]+/g, "-")}.json`, text, "application/json");
      toast({ tone: "ok", title: "Audit report signed", body: `${report.authorizations.length + report.settlements.length} entries, downloaded as JSON.` });
    } catch (e) {
      setErr(humanError(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card label="Rule 3" title="Audit reports">
      <p className="muted">
        A signed statement of your authorizations and on-chain settlements for a period. Share it with an auditor or regulator
        instead of your whole history. Anyone can check it below.
      </p>
      <div className="report-gen">
        <div className="seg" role="group" aria-label="Period">
          {RANGES.map((r) => (
            <button key={r.key} type="button" className={range === r.key ? "on" : ""} onClick={() => setRange(r.key)}>
              Last {r.label}
            </button>
          ))}
        </div>
        <button type="button" className="btn btn-pri" onClick={generate} disabled={busy}>
          <FileCheck2 size={16} /> {busy ? "Preparing & signing…" : "Generate & sign"}
        </button>
      </div>
      {err ? <Notice tone="bad">{err}</Notice> : null}

      {reports.length ? (
        <ul className="report-list">
          {reports.map((r) => (
            <li key={r.id}>
              <div>
                <strong>
                  {fmtDay(r.from)} – {fmtDay(r.to)}
                </strong>
                <span className="muted small">
                  {r.entries} entries · signed {fmtDate(r.createdAt)} · digest <span className="mono">{shortAddr(r.digest, 8, 6)}</span>
                </span>
              </div>
              <button
                type="button"
                className="icon-btn"
                aria-label="Download report"
                title="Download"
                onClick={() => download(`spectral-audit-${r.id}.json`, r.file, "application/json")}
              >
                <Download size={15} />
              </button>
              <button type="button" className="icon-btn" aria-label="Delete report" title="Delete" onClick={() => removeReport(address, r.id)}>
                <Trash2 size={15} />
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </Card>
  );
}

function VerifyReport() {
  const [result, setResult] = useState<(AuditVerification & { name: string; entries: number }) | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onFile(file: File | undefined) {
    if (!file) return;
    setErr(null);
    setResult(null);
    setBusy(true);
    try {
      const parsed = JSON.parse(await file.text()) as SignedAuditFile;
      if (parsed?.report?.schema !== "spectral.audit/1" || !parsed.signature) throw new Error("This isn't a Spectral audit report.");
      const v = await verifyAuditFile(parsed);
      setResult({ ...v, name: file.name, entries: parsed.report.authorizations.length + parsed.report.settlements.length });
    } catch (e) {
      setErr(e instanceof SyntaxError ? "The file isn't valid JSON." : humanError(e));
    } finally {
      setBusy(false);
    }
  }

  const ok = result && result.digestMatches && result.messageMatches && result.signatureValid;

  return (
    <Card label="For auditors" title="Verify a report">
      <p className="muted">Checks that the content is unchanged and that the holder really signed it (wallets and smart accounts).</p>
      <label className="file-drop">
        <input type="file" accept="application/json,.json" onChange={(e) => onFile(e.target.files?.[0])} />
        <Upload size={18} />
        <span>{busy ? "Verifying…" : "Choose a report file"}</span>
      </label>
      {err ? <Notice tone="bad">{err}</Notice> : null}
      {result ? (
        <div className={`verify-result ${ok ? "ok" : "bad"}`}>
          <div className="verify-head">
            {ok ? <CheckCircle2 size={20} /> : <ShieldAlert size={20} />}
            <strong>{ok ? "Authentic report" : "This report does not verify"}</strong>
            <Badge tone={ok ? "ok" : "bad"}>{result.name}</Badge>
          </div>
          <ul className="checks">
            <Line ok={result.digestMatches} text="Content matches its digest" />
            <Line ok={result.messageMatches} text="Signed statement matches the content" />
            <Line ok={result.signatureValid} text={`Signed by ${shortAddr(result.holder)} on ${chainMeta(result.chainId).name}`} />
          </ul>
          <p className="muted small">{result.entries} entries in the report.</p>
        </div>
      ) : null}
    </Card>
  );
}

function Line({ ok, text }: { ok: boolean; text: string }) {
  return (
    <li className={`check check--${ok ? "ok" : "block"}`}>
      {ok ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
      {text}
    </li>
  );
}

