import { useState } from "react";
import { BadgeCheck, RotateCcw, ShieldCheck, Trash2 } from "lucide-react";
import { chainMeta } from "../lib/chains";
import { deriveCard, normalizeHolder } from "../lib/card";
import { humanError } from "../lib/errors";
import { fmtDate, shortAddr } from "../lib/format";
import { credentialMessage, deriveCredential, verifyCredentialSignature } from "../lib/protocol";
import { setCredential, useWalletData } from "../lib/store";
import { useWallet } from "../hooks/data";
import { Badge, Card, CopyButton, Notice, PageHeader } from "../ui/kit";
import { BankCard } from "../ui/BankCard";
import { useToast } from "../ui/toast-context";

const METHOD_LABEL: Record<string, string> = {
  google: "Google",
  apple: "Apple",
  x: "X",
  github: "GitHub",
  discord: "Discord",
  email: "Email",
};

type Check = { tone: "ok" | "bad" | "warn"; text: string } | null;

export default function Credential() {
  const w = useWallet();
  const data = useWalletData(w.address);
  const toast = useToast();
  const [busy, setBusy] = useState<"issue" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<Check>(null);
  const [confirmRevoke, setConfirmRevoke] = useState(false);
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState<string | null>(null);

  const c = data.credential;
  const method = w.loginMethod ? (METHOD_LABEL[w.loginMethod] ?? w.loginMethod) : w.connectorName ?? "Wallet";

  /** Signs the credential statement (Solana signMessage). */
  const sign = () => w.signMessage(credentialMessage(w.address!));

  async function issue() {
    if (!w.address) return;
    // The card name comes first: nothing is signed until it's valid.
    const holder = normalizeHolder(name || c?.holderName || "");
    if (holder.error) {
      setNameErr(holder.error);
      return;
    }
    setNameErr(null);
    setBusy("issue");
    setError(null);
    try {
      const chainId = w.chainId;
      const sig = await sign();
      if (!verifyCredentialSignature(w.address, sig)) throw new Error("The signature didn't verify against this address.");
      const { id, commitment } = deriveCredential(sig, w.address);
      setCredential(w.address, {
        id,
        commitment,
        chainId,
        issuedAt: Date.now(),
        method,
        deterministic: null,
        holderName: holder.value,
      });
      toast({ tone: "ok", title: "Your Spectral card is ready", body: `Issued to ${holder.value} on ${chainMeta(chainId).name}` });
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  }

  /** Signs the same statement again: proves the wallet still controls the credential. */
  async function verify() {
    if (!w.address || !c) return;
    setBusy("verify");
    setCheck(null);
    try {
      const sig = await sign();
      if (!verifyCredentialSignature(w.address, sig)) {
        setCheck({ tone: "bad", text: "The signature didn't verify for this address." });
        return;
      }
      const same = deriveCredential(sig, w.address).id === c.id;
      setCredential(w.address, { ...c, deterministic: same });
      setCheck(
        same
          ? { tone: "ok", text: "Verified. Your wallet re-derived the same credential ID." }
          : {
              tone: "warn",
              text: "Signature valid, but your wallet signs differently each time (some embedded and MPC wallets do), so the ID stays tied to the original signature.",
            },
      );
    } catch (e) {
      setCheck({ tone: "bad", text: humanError(e) });
    } finally {
      setBusy(null);
    }
  }

  return (
    <>
      <PageHeader
        eyebrow="Privacy & control"
        title="Credential"
        sub="Your credential authorizes spending. It proves permission to pay, and it's derived from one signature that never moves funds."
      />

      {error ? <Notice tone="bad">{error}</Notice> : null}

      {c ? (
        <div className="cred-grid">
          <div className="cred-card-col">
            {c.holderName ? (
              <BankCard card={deriveCard(c.id, c.issuedAt)} holder={c.holderName} />
            ) : (
              <Card label="Your card" title="Add the name for your card">
                <form
                  className="form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const h = normalizeHolder(name);
                    if (h.error) return setNameErr(h.error);
                    setCredential(w.address!, { ...c, holderName: h.value });
                    setNameErr(null);
                  }}
                >
                  <label className="field">
                    <span className="field-label">Name on card</span>
                    <input className="input" value={name} maxLength={26} onChange={(e) => setName(e.target.value)} autoComplete="name" />
                    {nameErr ? <span className="field-err">{nameErr}</span> : null}
                  </label>
                  <button type="submit" className="btn btn-pri">
                    Create card
                  </button>
                </form>
              </Card>
            )}
          </div>

          <Card title="Details" action={<Badge tone={c.chainId === w.chainId ? "ok" : "warn"}>{c.chainId === w.chainId ? "Active" : "Other network"}</Badge>}>
            <dl className="kv">
              {c.holderName ? (
                <div>
                  <dt>Card holder</dt>
                  <dd>{c.holderName}</dd>
                </div>
              ) : null}
              <div>
                <dt>Credential ID</dt>
                <dd className="mono">
                  {shortAddr(c.id, 12, 8)} <CopyButton value={c.id} />
                </dd>
              </div>
              <div>
                <dt>Commitment</dt>
                <dd className="mono">
                  {shortAddr(c.commitment, 12, 8)} <CopyButton value={c.commitment} />
                </dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>{chainMeta(c.chainId).name}</dd>
              </div>
              <div>
                <dt>Issued</dt>
                <dd>{fmtDate(c.issuedAt)}</dd>
              </div>
              <div>
                <dt>Signed in with</dt>
                <dd>{c.method}</dd>
              </div>
              <div>
                <dt>Re-derivable</dt>
                <dd>{c.deterministic == null ? "Not checked yet" : c.deterministic ? "Yes" : "No, tied to first signature"}</dd>
              </div>
            </dl>

            {check ? <Notice tone={check.tone}>{check.text}</Notice> : null}
            {c.chainId !== w.chainId ? (
              <Notice tone="warn">This credential was issued on {chainMeta(c.chainId).name}. Issue a new one to pay on {chainMeta(w.chainId).name}.</Notice>
            ) : null}

            <div className="row-actions">
              <button type="button" className="btn btn-sec" onClick={verify} disabled={!!busy}>
                <ShieldCheck size={16} /> {busy === "verify" ? "Waiting for signature…" : "Verify ownership"}
              </button>
              {c.chainId !== w.chainId ? (
                <button type="button" className="btn btn-pri" onClick={issue} disabled={!!busy}>
                  <RotateCcw size={16} /> Issue for {chainMeta(w.chainId).short}
                </button>
              ) : null}
              {confirmRevoke ? (
                <>
                  <button
                    type="button"
                    className="btn btn-danger"
                    onClick={() => {
                      setCredential(w.address!, null);
                      setConfirmRevoke(false);
                      setCheck(null);
                    }}
                  >
                    Yes, revoke
                  </button>
                  <button type="button" className="btn btn-sec" onClick={() => setConfirmRevoke(false)}>
                    Cancel
                  </button>
                </>
              ) : (
                <button type="button" className="btn btn-ghost" onClick={() => setConfirmRevoke(true)}>
                  <Trash2 size={16} /> Revoke on this device
                </button>
              )}
            </div>
          </Card>
        </div>
      ) : (
        <div className="cred-grid">
          <Card label="New credential" title="Issue your spending credential">
            <ol className="cred-steps">
              <li>
                <strong>Enter the name for your card.</strong> It's printed on your Spectral card.
                <label className="field cred-name">
                  <span className="visually-hidden">Name on card</span>
                  <input
                    className={`input${nameErr ? " input--bad" : ""}`}
                    placeholder="Full name"
                    value={name}
                    maxLength={26}
                    autoComplete="name"
                    onChange={(e) => {
                      setName(e.target.value);
                      if (nameErr) setNameErr(null);
                    }}
                  />
                  {nameErr ? <span className="field-err">{nameErr}</span> : null}
                </label>
              </li>
              <li>
                <strong>You sign one statement.</strong> Your wallet shows exactly this text:
                <blockquote className="statement" style={{ whiteSpace: "pre-line" }}>
                  {credentialMessage(w.address ?? "")}
                </blockquote>
              </li>
              <li>
                <strong>The credential is derived from that signature.</strong> The signature is hashed immediately and never stored.
              </li>
              <li>
                <strong>Your card is issued.</strong> A Spectral card tied to the credential, ready to authorize payments.
              </li>
            </ol>
            <div className="row-actions">
              <button type="button" className="btn btn-pri" onClick={issue} disabled={!!busy || w.unsupported}>
                <BadgeCheck size={16} /> {busy === "issue" ? "Waiting for signature…" : "Issue credential & card"}
              </button>
            </div>
          </Card>
          <Card label="Signed in" title={method}>
            <p className="muted">
              {w.loginMethod
                ? `You're using a ${method}-backed wallet: no seed phrase, recoverable with the same login.`
                : "You're signed in with a self-custodied wallet."}
            </p>
            {w.loginEmail ? (
              <dl className="kv">
                <div>
                  <dt>Email</dt>
                  <dd>{w.loginEmail}</dd>
                </div>
              </dl>
            ) : null}
            <p className="muted small">Issuing on {chainMeta(w.chainId).name}. Credentials are scoped to one network.</p>
          </Card>
        </div>
      )}
    </>
  );
}
