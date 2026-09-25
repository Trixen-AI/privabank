import { useState } from "react";
import { useAppKit, useAppKitNetwork, useDisconnect } from "@reown/appkit/react";
import { Download, LogOut, Trash2, Upload, Wallet } from "lucide-react";
import { chainMeta } from "../lib/chains";
import { download } from "../lib/download";
import { RELAYER_URL } from "../lib/env";
import { humanError } from "../lib/errors";
import { clearWallet, parseBackup, replaceWallet, useWalletData } from "../lib/store";
import { networks } from "../wallet/config";
import { useRelayerHealth, useWallet } from "../hooks/data";
import { AddressChip, Badge, Card, Notice, PageHeader } from "../ui/kit";
import { useToast } from "../ui/toast-context";

export default function Settings() {
  const w = useWallet();
  const data = useWalletData(w.address);
  const { open } = useAppKit();
  const { disconnect } = useDisconnect();
  const { switchNetwork } = useAppKitNetwork();
  const relayer = useRelayerHealth();
  const toast = useToast();
  const [confirmClear, setConfirmClear] = useState(false);
  const [importErr, setImportErr] = useState<string | null>(null);

  const counts = {
    credential: data.credential ? 1 : 0,
    merchants: data.policy.merchants.length,
    limits: Object.keys(data.policy.dailyLimits).length,
    authorizations: data.authorizations.length,
    reports: data.reports.length,
  };

  async function importBackup(file: File | undefined) {
    if (!file || !w.address) return;
    setImportErr(null);
    try {
      const parsed = parseBackup(await file.text());
      const holder = (JSON.parse(await file.text()) as { holder?: string }).holder;
      if (holder && holder.toLowerCase() !== w.address.toLowerCase())
        throw new Error("This backup belongs to a different address.");
      replaceWallet(w.address, parsed);
      toast({ tone: "ok", title: "Backup restored" });
    } catch (e) {
      setImportErr(e instanceof SyntaxError ? "That file isn't valid JSON." : humanError(e));
    }
  }

  return (
    <>
      <PageHeader eyebrow="Account" title={<>Account <em>settings.</em></>} />

      <div className="g-2">
        <Card label="Account" title="Signed in">
          <dl className="kv">
            <div>
              <dt>Address</dt>
              <dd>{w.address ? <AddressChip address={w.address} chainId={w.chainId} /> : "–"}</dd>
            </div>
            <div>
              <dt>Connected with</dt>
              <dd>{w.loginMethod ? `${w.loginMethod[0].toUpperCase()}${w.loginMethod.slice(1)} login` : w.connectorName ?? "–"}</dd>
            </div>
            {w.loginEmail ? (
              <div>
                <dt>Email</dt>
                <dd>{w.loginEmail}</dd>
              </div>
            ) : null}
          </dl>
          <div className="row-actions">
            <button type="button" className="btn btn-sec" onClick={() => open({ view: "Account" })}>
              <Wallet size={16} /> Wallet details
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => disconnect()}>
              <LogOut size={16} /> Sign out
            </button>
          </div>
        </Card>

        <Card label="Network" title={chainMeta(w.chainId).name}>
          <ul className="net-list">
            {networks.map((n) => {
              const id = Number(n.id);
              const meta = chainMeta(id);
              const active = !w.unsupported && w.walletChain === id;
              return (
                <li key={id}>
                  <span>
                    <strong>{meta.name}</strong>
                    <span className="muted small"> · chain {id}</span>
                  </span>
                  {meta.testnet ? <Badge tone="muted">Testnet</Badge> : null}
                  {active ? (
                    <Badge tone="ok">Connected</Badge>
                  ) : (
                    <button type="button" className="btn btn-sec btn-sm" onClick={() => switchNetwork(n)}>
                      Switch
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </Card>
      </div>

      <Card label="Settlement" title="Relayer">
        {RELAYER_URL ? (
          <dl className="kv">
            <div>
              <dt>Endpoint</dt>
              <dd className="mono">{RELAYER_URL}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{relayer.data ? <Badge tone={relayer.data.ok ? "ok" : "bad"}>{relayer.data.detail}</Badge> : "Checking…"}</dd>
            </div>
          </dl>
        ) : (
          <p className="muted">
            No relayer is connected, so payments settle from your own wallet: you pay gas and the transfer is public. Gasless relayed
            settlement switches on here as soon as a relayer is online.
          </p>
        )}
      </Card>

      <Card label="Stored on this device" title="Your CassaFi data">
        <p className="muted">
          Credential ID, spending rules, authorizations and reports live in this browser only, per address. Back them up before
          clearing site data or switching devices.
        </p>
        <ul className="data-counts">
          <li>
            <strong>{counts.credential}</strong> credential
          </li>
          <li>
            <strong>{counts.limits}</strong> limits
          </li>
          <li>
            <strong>{counts.merchants}</strong> merchants
          </li>
          <li>
            <strong>{counts.authorizations}</strong> authorizations
          </li>
          <li>
            <strong>{counts.reports}</strong> reports
          </li>
        </ul>
        {importErr ? <Notice tone="bad">{importErr}</Notice> : null}
        <div className="row-actions">
          <button
            type="button"
            className="btn btn-sec"
            onClick={() =>
              download(
                `cassafi-backup-${w.address?.slice(0, 8)}-${new Date().toISOString().slice(0, 10)}.json`,
                JSON.stringify({ ...data, holder: w.address }, null, 2),
                "application/json",
              )
            }
          >
            <Download size={16} /> Export backup
          </button>
          <label className="btn btn-sec file-btn">
            <Upload size={16} /> Restore backup
            <input type="file" accept="application/json,.json" onChange={(e) => importBackup(e.target.files?.[0])} />
          </label>
          {confirmClear ? (
            <>
              <button
                type="button"
                className="btn btn-danger"
                onClick={() => {
                  clearWallet(w.address!);
                  setConfirmClear(false);
                  toast({ tone: "info", title: "Local data cleared" });
                }}
              >
                Yes, clear everything
              </button>
              <button type="button" className="btn btn-sec" onClick={() => setConfirmClear(false)}>
                Cancel
              </button>
            </>
          ) : (
            <button type="button" className="btn btn-ghost" onClick={() => setConfirmClear(true)}>
              <Trash2 size={16} /> Clear local data
            </button>
          )}
        </div>
      </Card>

    </>
  );
}
