import { Link } from "react-router";
import { EyeOff, Plus, RefreshCw } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { addressUrl, chainMeta } from "../lib/chains";
import { fmtAgo, fmtDay, shortAddr } from "../lib/format";
import { setPolicy, useWalletData } from "../lib/store";
import { useExposure, useWallet } from "../hooks/data";
import { Card, Empty, ErrorNote, Notice, PageHeader, Skeleton } from "../ui/kit";
import { ExposureGauge } from "../ui/ExposureGauge";

/**
 * The glass-house view: everything a stranger learns about this address from
 * the public ledger. Built from live balances, the account nonce, ENS and the
 * loaded transfer history, so it changes as the account does.
 */
export default function Privacy() {
  const w = useWallet();
  const data = useWalletData(w.address);
  const qc = useQueryClient();
  const { exposure, footprint, loading, error, activitySource } = useExposure(w.chainId, w.address);
  const chain = chainMeta(w.chainId);

  const refresh = () => {
    qc.invalidateQueries({ queryKey: ["portfolio", w.chainId, w.address] });
    qc.invalidateQueries({ queryKey: ["footprint", w.chainId, w.address] });
    qc.invalidateQueries({ queryKey: ["activity", w.chainId, w.address] });
  };

  return (
    <>
      <PageHeader
        eyebrow="Privacy & control"
        title={<>Exposure <em>report.</em></>}
        sub={`What anyone can learn about ${shortAddr(w.address)} from ${chain.name}'s public ledger, without asking you.`}
        actions={
          <button type="button" className="btn btn-sec" onClick={refresh} disabled={loading}>
            <RefreshCw size={16} /> Re-scan
          </button>
        }
      />

      <ErrorNote error={error} />

      {loading && !exposure ? (
        <div className="privacy-grid">
          <Card>
            <Skeleton h={180} />
          </Card>
          <Card>
            <Skeleton h={180} />
          </Card>
        </div>
      ) : exposure ? (
        <>
          <div className="privacy-grid">
            <Card className="privacy-score">
              <ExposureGauge score={exposure.score} level={exposure.level} size={220} />
              <p>
                {exposure.level === "Low"
                  ? "Little is visible right now. That changes with the first public payment."
                  : `A stranger can build a ${exposure.level.toLowerCase()}-detail picture of this account from public data alone.`}
              </p>
              <p className="muted small">
                Based on {exposure.sample} loaded transfer{exposure.sample === 1 ? "" : "s"}
                {footprint?.explorerTxCount != null ? ` of ${footprint.explorerTxCount.toLocaleString("en-US")} indexed` : ""}
                {exposure.firstSeen ? `, going back to ${fmtDay(exposure.firstSeen)}` : ""}.
              </p>
            </Card>

            <Card label="What's visible" title="Findings">
              <ul className="findings">
                {exposure.findings.map((f) => (
                  <li key={f.title}>
                    <div className="finding-head">
                      <strong>{f.title}</strong>
                      <span className="mono small muted">
                        {f.weight}/{f.max}
                      </span>
                    </div>
                    <p className="muted">{f.detail}</p>
                    <div className={`meter meter--${f.weight === 0 ? "ok" : f.weight / f.max >= 0.75 ? "bad" : "warn"}`}>
                      <span style={{ width: `${(f.weight / f.max) * 100}%` }} />
                    </div>
                  </li>
                ))}
              </ul>
            </Card>
          </div>

          {activitySource === "rpc" ? (
            <Notice tone="info">
              History on {chain.short} is read from chain logs because its explorer blocks browser requests. Token transfers are
              included; plain ETH transfers are not, so the real exposure may be higher.
            </Notice>
          ) : null}

          <Card label="Your graph" title="Counterparties anyone can link to you">
            {exposure.counterparties.length ? (
              <div className="table-wrap">
                <table className="tbl">
                  <thead>
                    <tr>
                      <th>Address</th>
                      <th>Transfers</th>
                      <th>You sent</th>
                      <th>Last seen</th>
                      <th aria-label="Actions" />
                    </tr>
                  </thead>
                  <tbody>
                    {exposure.counterparties.slice(0, 12).map((c) => {
                      const known = data.policy.merchants.find((m) => m.address.toLowerCase() === c.address.toLowerCase());
                      return (
                        <tr key={c.address}>
                          <td>
                            <a className="mono" href={addressUrl(w.chainId, c.address)} target="_blank" rel="noopener noreferrer">
                              {shortAddr(c.address)}
                            </a>
                            {known ? <span className="muted small"> · {known.label}</span> : null}
                          </td>
                          <td className="mono">{c.count}</td>
                          <td className="mono">{c.outCount}</td>
                          <td className="muted">{c.lastSeen ? fmtAgo(c.lastSeen) : "–"}</td>
                          <td className="tbl-act">
                            {known ? null : (
                              <button
                                type="button"
                                className="btn btn-ghost btn-sm"
                                onClick={() =>
                                  setPolicy(w.address!, (p) => ({
                                    ...p,
                                    merchants: [{ address: c.address, label: shortAddr(c.address), addedAt: Date.now() }, ...p.merchants],
                                  }))
                                }
                              >
                                <Plus size={14} /> Allowlist
                              </button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            ) : (
              <Empty title="No counterparties found">No transfers with other addresses in the loaded history.</Empty>
            )}
          </Card>

          <Card label="With CassaFi" title="How authorization-based banking changes this">
            <ul className="compare">
              <li>
                <span className="compare-k">Balance</span>
                <span className="compare-was">Readable by anyone</span>
                <span className="compare-now">Held as notes in a shared pool; nothing addressed to you</span>
              </li>
              <li>
                <span className="compare-k">Payments</span>
                <span className="compare-was">Sent from this address</span>
                <span className="compare-now">Authorized by credential, submitted by a relayer</span>
              </li>
              <li>
                <span className="compare-k">Counterparties</span>
                <span className="compare-was">Linked to you forever</span>
                <span className="compare-now">Merchants see a clean stablecoin payment, not your history</span>
              </li>
              <li>
                <span className="compare-k">Compliance</span>
                <span className="compare-was">Share your whole address</span>
                <span className="compare-now">Share a signed report for exactly the period asked</span>
              </li>
            </ul>
            <div className="row-actions">
              <Link className="btn btn-pri" to="/app/credential">
                <EyeOff size={16} /> Start with your credential
              </Link>
              <Link className="btn btn-sec" to="/app/controls">
                Generate an audit report
              </Link>
            </div>
          </Card>
        </>
      ) : null}
    </>
  );
}
