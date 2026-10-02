import { useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSendTransaction, useSignTypedData, useSwitchChain, useWriteContract } from "wagmi";
import { erc20Abi, formatEther, getAddress, isAddress, type Hex } from "viem";
import { normalize } from "viem/ens";
import { AlertTriangle, BadgeCheck, Check, CircleSlash, Loader2, Radio, Send, Wallet } from "lucide-react";
import { chainMeta, txUrl } from "../lib/chains";
import { publicClient } from "../lib/clients";
import { RELAYER_URL } from "../lib/env";
import { humanError, isUserRejection } from "../lib/errors";
import { fmtAmount, shortAddr } from "../lib/format";
import {
  AUTH_TTL_MS,
  checkPolicy,
  domain,
  isNative,
  newDraft,
  parseAmount,
  PAYMENT_TYPES,
  paymentMessage,
  spentToday,
  submitToRelayer,
} from "../lib/protocol";
import { addAuthorization, limitKey, patchAuthorization, useWalletData, type Authorization } from "../lib/store";
import type { Holding } from "../lib/data";
import { usePortfolio, useWallet } from "../hooks/data";
import { Badge, Card, Empty, Notice, PageHeader, Skeleton, TokenAvatar } from "../ui/kit";
import { useToast } from "../ui/toast-context";

type Phase = "form" | "signing" | "settling" | "confirming" | "done" | "error";
type Method = "relayer" | "wallet";

export default function Pay() {
  const w = useWallet();
  const data = useWalletData(w.address);
  const portfolio = usePortfolio(w.chainId, w.address);
  const [params] = useSearchParams();
  const qc = useQueryClient();
  const toast = useToast();

  const [recipientInput, setRecipientInput] = useState(params.get("to") ?? "");
  const [tokenAddr, setTokenAddr] = useState<string | null>(params.get("token"));
  const [amountInput, setAmountInput] = useState("");
  const [memo, setMemo] = useState("");
  const [method, setMethod] = useState<Method>(RELAYER_URL ? "relayer" : "wallet");
  const [phase, setPhase] = useState<Phase>("form");
  const [current, setCurrent] = useState<Authorization | null>(null);
  const [error, setError] = useState<string | null>(null);

  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const holdings = useMemo(() => (portfolio.data?.holdings ?? []).filter((h) => h.raw > 0n), [portfolio.data]);
  const token: Holding | null =
    holdings.find((h) => tokenAddr && h.token.toLowerCase() === tokenAddr.toLowerCase()) ?? holdings[0] ?? null;

  // ENS names resolve on Ethereum regardless of the payment network.
  const ensName = recipientInput.trim().toLowerCase().endsWith(".eth") ? recipientInput.trim().toLowerCase() : null;
  const ens = useQuery({
    queryKey: ["ens", ensName],
    queryFn: () => publicClient(1).getEnsAddress({ name: normalize(ensName!) }),
    enabled: !!ensName,
    staleTime: 5 * 60_000,
  });
  const recipient = ensName ? (ens.data ?? "") : recipientInput.trim();

  const amount = token ? parseAmount(amountInput, token.decimals) : null;
  const issues = w.address
    ? checkPolicy(data, {
        chainId: w.chainId,
        owner: w.address,
        recipient,
        token: token ? { address: token.token, symbol: token.symbol, decimals: token.decimals } : null,
        amount,
        balance: token?.raw ?? null,
      })
    : [];
  if (ensName && !ens.isLoading && !ens.data) issues.unshift({ level: "block", text: `${ensName} doesn't resolve to an address.` });
  const blocked = issues.some((i) => i.level === "block") || w.unsupported;

  // Network fee for wallet settlement, estimated against the live chain.
  const canEstimate = !!(w.address && token && amount && isAddress(recipient) && method === "wallet" && !blocked);
  const fee = useQuery({
    queryKey: ["fee", w.chainId, token?.token, recipient, amount?.toString()],
    enabled: canEstimate,
    queryFn: async () => {
      const c = publicClient(w.chainId);
      const [gas, price] = await Promise.all([
        isNative(token!.token)
          ? c.estimateGas({ account: w.address!, to: getAddress(recipient), value: amount! })
          : c.estimateContractGas({
              account: w.address!,
              address: token!.token,
              abi: erc20Abi,
              functionName: "transfer",
              args: [getAddress(recipient), amount!],
            }),
        c.getGasPrice(),
      ]);
      return gas * price;
    },
    retry: false,
  });

  const cap = token ? data.policy.dailyLimits[limitKey(w.chainId, token.token)] : undefined;
  const used = token ? spentToday(data, w.chainId, token.token) : 0n;

  async function settle(auth: Authorization, how: Method) {
    const addr = w.address!;
    setPhase("settling");
    try {
      let hash: Hex | undefined;
      if (how === "relayer") {
        const res = await submitToRelayer(auth);
        patchAuthorization(addr, auth.id, { status: res.txHash ? "submitted" : "relayed", relayerRef: res.id, txHash: res.txHash, settlement: "relayer" });
        hash = res.txHash;
      } else {
        if (w.walletChain !== auth.chainId) await switchChainAsync({ chainId: auth.chainId });
        hash = isNative(auth.token.address)
          ? await sendTransactionAsync({ chainId: auth.chainId, to: auth.recipient, value: BigInt(auth.amount) })
          : await writeContractAsync({
              chainId: auth.chainId,
              address: auth.token.address,
              abi: erc20Abi,
              functionName: "transfer",
              args: [auth.recipient, BigInt(auth.amount)],
            });
        patchAuthorization(addr, auth.id, { status: "submitted", txHash: hash, settlement: "wallet" });
      }

      if (!hash) {
        setCurrent({ ...auth, status: "relayed" });
        setPhase("done");
        toast({ tone: "ok", title: "Authorization accepted", body: "The relayer queued your payment." });
        return;
      }

      setCurrent({ ...auth, txHash: hash, status: "submitted" });
      setPhase("confirming");
      const receipt = await publicClient(auth.chainId).waitForTransactionReceipt({ hash, timeout: 180_000 });
      const ok = receipt.status === "success";
      patchAuthorization(addr, auth.id, { status: ok ? "settled" : "failed", error: ok ? undefined : "Reverted on-chain" });
      setCurrent({ ...auth, txHash: hash, status: ok ? "settled" : "failed" });
      setPhase(ok ? "done" : "error");
      if (!ok) setError("The transaction reverted on-chain.");
      qc.invalidateQueries({ queryKey: ["portfolio", auth.chainId] });
      qc.invalidateQueries({ queryKey: ["activity", auth.chainId] });
      toast({
        tone: ok ? "ok" : "bad",
        title: ok ? "Payment settled" : "Payment failed",
        body: `${fmtAmount(BigInt(auth.amount), auth.token.decimals)} ${auth.token.symbol} to ${shortAddr(auth.recipient)}`,
        href: txUrl(auth.chainId, hash),
        hrefLabel: "View transaction",
      });
    } catch (e) {
      const msg = humanError(e);
      patchAuthorization(addr, auth.id, { status: "failed", error: msg });
      setCurrent({ ...auth, status: "failed", error: msg });
      setError(msg);
      setPhase("error");
    }
  }

  async function authorize() {
    if (!w.address || !token || !amount || !data.credential || blocked) return;
    setError(null);
    setPhase("signing");
    const draft = newDraft({
      chainId: w.chainId,
      credential: data.credential.id,
      recipient: getAddress(recipient),
      token: { address: token.token, symbol: token.symbol, decimals: token.decimals },
      amount,
    });
    let signature: Hex;
    try {
      if (w.walletChain !== draft.chainId) await switchChainAsync({ chainId: draft.chainId });
      signature = await signTypedDataAsync({
        domain: domain(draft.chainId),
        types: PAYMENT_TYPES,
        primaryType: "PaymentAuthorization",
        message: paymentMessage(draft),
      });
    } catch (e) {
      setPhase(isUserRejection(e) ? "form" : "error");
      setError(humanError(e));
      return;
    }
    const auth: Authorization = {
      id: draft.nonce,
      chainId: draft.chainId,
      credential: draft.credential,
      token: draft.token,
      recipient: draft.recipient,
      amount: draft.amount.toString(),
      deadline: draft.deadline,
      createdAt: draft.deadline - AUTH_TTL_MS,
      memo: memo.trim() || undefined,
      signature,
      status: "signed",
    };
    addAuthorization(w.address, auth);
    setCurrent(auth);
    await settle(auth, method);
  }

  function reset() {
    setPhase("form");
    setCurrent(null);
    setError(null);
    setAmountInput("");
    setMemo("");
  }

  const chain = chainMeta(w.chainId);

  if (!data.credential) {
    return (
      <>
        <PageHeader eyebrow="Banking" title="Authorize a payment" />
        <Card>
          <Empty
            icon={<BadgeCheck size={22} />}
            title="Issue your credential first"
            action={
              <Link className="btn btn-pri" to="/app/credential">
                Issue credential
              </Link>
            }
          >
            Every Spectral payment is authorized with your credential. Issuing it takes one signature and doesn't move funds.
          </Empty>
        </Card>
      </>
    );
  }

  if (phase !== "form" && current) {
    return (
      <>
        <PageHeader eyebrow="Banking" title="Authorize a payment" />
        <PayProgress phase={phase} auth={current} error={error} onReset={reset} onRetry={() => settle(current, "wallet")} />
      </>
    );
  }

  return (
    <>
      <PageHeader
        eyebrow="Banking"
        title="Authorize a payment"
        sub={`You sign an authorization with your credential. It is checked against your spending rules before anything leaves ${chain.short}.`}
      />

      {w.unsupported ? <Notice tone="warn">Switch your wallet to a supported network to pay.</Notice> : null}
      {phase === "form" && error ? <Notice tone="bad">{error}</Notice> : null}

      <div className="pay-grid">
        <Card label="Payment" title="Details">
          <form
            className="form"
            onSubmit={(e) => {
              e.preventDefault();
              void authorize();
            }}
          >
            <label className="field">
              <span className="field-label">Recipient</span>
              <input
                className="input mono"
                placeholder="0x… or name.eth"
                value={recipientInput}
                onChange={(e) => setRecipientInput(e.target.value)}
                list="merchant-list"
                autoComplete="off"
                spellCheck={false}
              />
              <datalist id="merchant-list">
                {data.policy.merchants.map((m) => (
                  <option key={m.address} value={m.address}>
                    {m.label}
                  </option>
                ))}
              </datalist>
              {ensName ? (
                <span className="field-hint">
                  {ens.isLoading ? "Resolving…" : ens.data ? <>Resolves to <span className="mono">{shortAddr(ens.data)}</span></> : "Not found"}
                </span>
              ) : null}
              {data.policy.merchants.length ? (
                <div className="chips">
                  {data.policy.merchants.slice(0, 6).map((m) => (
                    <button type="button" key={m.address} className="chip" onClick={() => setRecipientInput(m.address)}>
                      {m.label}
                    </button>
                  ))}
                </div>
              ) : null}
            </label>

            <div className="field">
              <span className="field-label">Asset</span>
              {portfolio.isLoading ? (
                <Skeleton h={48} />
              ) : holdings.length ? (
                <div className="asset-pick" role="radiogroup" aria-label="Asset">
                  {holdings.slice(0, 8).map((h) => (
                    <button
                      type="button"
                      role="radio"
                      aria-checked={token?.token === h.token}
                      key={h.token}
                      className={`asset-opt${token?.token === h.token ? " on" : ""}`}
                      onClick={() => setTokenAddr(h.token)}
                    >
                      <TokenAvatar symbol={h.symbol} address={h.token} icon={h.icon} size={28} />
                      <span>
                        <strong>{h.symbol}</strong>
                        <span className="muted small">{fmtAmount(h.raw, h.decimals)}</span>
                      </span>
                    </button>
                  ))}
                </div>
              ) : (
                <p className="muted">This address holds nothing on {chain.short} yet.</p>
              )}
            </div>

            <label className="field">
              <span className="field-label">Amount</span>
              <div className="input-group">
                <input
                  className="input mono"
                  inputMode="decimal"
                  placeholder="0.00"
                  value={amountInput}
                  onChange={(e) => setAmountInput(e.target.value.replace(",", "."))}
                />
                <span className="input-suffix">{token?.symbol ?? ""}</span>
                {token ? (
                  <button
                    type="button"
                    className="btn btn-sec btn-sm"
                    onClick={() => setAmountInput(fmtAmount(token.raw, token.decimals, token.decimals).replace(/,/g, ""))}
                  >
                    Max
                  </button>
                ) : null}
              </div>
              {cap && token ? (
                <span className="field-hint">
                  Daily limit {cap} {token.symbol} · {fmtAmount(used, token.decimals)} used in the last 24h
                </span>
              ) : null}
            </label>

            <label className="field">
              <span className="field-label">
                Memo <span className="muted">(optional, stays on this device)</span>
              </span>
              <input className="input" maxLength={80} value={memo} onChange={(e) => setMemo(e.target.value)} placeholder="Invoice 4471" />
            </label>

            <fieldset className="field">
              <legend className="field-label">Settlement</legend>
              <div className="method-pick">
                <label className={`method${method === "relayer" ? " on" : ""}${!RELAYER_URL ? " off" : ""}`}>
                  <input type="radio" name="method" checked={method === "relayer"} disabled={!RELAYER_URL} onChange={() => setMethod("relayer")} />
                  <Radio size={18} />
                  <span>
                    <strong>Relayer</strong>
                    <span className="muted small">
                      {RELAYER_URL ? "Gasless. The relayer pays gas and submits for you." : "No relayer is online for this app yet."}
                    </span>
                  </span>
                </label>
                <label className={`method${method === "wallet" ? " on" : ""}`}>
                  <input type="radio" name="method" checked={method === "wallet"} onChange={() => setMethod("wallet")} />
                  <Wallet size={18} />
                  <span>
                    <strong>From your wallet</strong>
                    <span className="muted small">You pay gas. The transfer is visible on the explorer like any wallet payment.</span>
                  </span>
                </label>
              </div>
            </fieldset>

            <button type="submit" className="btn btn-pri pay-submit" disabled={blocked || phase !== "form"}>
              <Send size={16} /> Sign authorization
            </button>
          </form>
        </Card>

        <div className="stack-16">
          <Card label="Review" title="Summary">
            <dl className="kv">
              <div>
                <dt>You pay</dt>
                <dd className="mono">{amount && token ? `${fmtAmount(amount, token.decimals)} ${token.symbol}` : "–"}</dd>
              </div>
              <div>
                <dt>To</dt>
                <dd className="mono">{isAddress(recipient) ? shortAddr(recipient) : "–"}</dd>
              </div>
              <div>
                <dt>Network</dt>
                <dd>{chain.name}</dd>
              </div>
              <div>
                <dt>Network fee</dt>
                <dd className="mono">
                  {method === "relayer"
                    ? "Paid by relayer"
                    : fee.data != null
                      ? `≈ ${Number(formatEther(fee.data)).toPrecision(3)} ETH`
                      : fee.isFetching
                        ? "Estimating…"
                        : fee.error
                          ? "Can't estimate"
                          : "–"}
                </dd>
              </div>
              <div>
                <dt>Valid for</dt>
                <dd>15 minutes after signing</dd>
              </div>
            </dl>
          </Card>

          <Card label="Credential" title="Policy checks">
            {issues.length ? (
              <ul className="checks">
                {issues.map((i) => (
                  <li key={i.text} className={`check check--${i.level}`}>
                    {i.level === "block" ? <CircleSlash size={16} /> : <AlertTriangle size={16} />}
                    {i.text}
                  </li>
                ))}
              </ul>
            ) : (
              <p className="check check--ok">
                <Check size={16} /> Everything checks out. Ready to sign.
              </p>
            )}
          </Card>
        </div>
      </div>
    </>
  );
}

function PayProgress({
  phase,
  auth,
  error,
  onReset,
  onRetry,
}: {
  phase: Phase;
  auth: Authorization;
  error: string | null;
  onReset: () => void;
  onRetry: () => void;
}) {
  const steps: { key: Phase[]; label: string }[] = [
    { key: ["signing"], label: "Sign authorization" },
    { key: ["settling"], label: "Settle" },
    { key: ["confirming"], label: "Confirm on-chain" },
  ];
  const order: Phase[] = ["signing", "settling", "confirming", "done"];
  const at = phase === "error" ? -1 : order.indexOf(phase);

  return (
    <Card className="progress-card">
      <div className="progress-amount">
        <span className="ds-label">{phase === "done" ? "Payment complete" : phase === "error" ? "Payment stopped" : "In progress"}</span>
        <strong>
          {fmtAmount(BigInt(auth.amount), auth.token.decimals)} {auth.token.symbol}
        </strong>
        <span className="muted">to {shortAddr(auth.recipient)}</span>
      </div>

      <ol className="steps">
        {steps.map((s, i) => {
          const state = phase === "error" ? (i === 0 ? "done" : "idle") : at > i ? "done" : at === i ? "active" : "idle";
          return (
            <li key={s.label} className={`step step--${state}`}>
              <span className="step-ico">{state === "done" ? <Check size={14} /> : state === "active" ? <Loader2 size={14} className="spin" /> : i + 1}</span>
              {s.label}
            </li>
          );
        })}
      </ol>

      {phase === "signing" ? <p className="muted">Check your wallet: it's asking you to sign the payment authorization.</p> : null}
      {phase === "settling" ? <p className="muted">Submitting the payment. Your wallet may ask you to confirm the transfer.</p> : null}
      {phase === "confirming" ? <p className="muted">Waiting for the network to include the transaction.</p> : null}
      {error ? <Notice tone="bad">{error}</Notice> : null}

      {auth.txHash ? (
        <p>
          <a href={txUrl(auth.chainId, auth.txHash)} target="_blank" rel="noopener noreferrer">
            View transaction on the explorer
          </a>
        </p>
      ) : null}

      {phase === "done" || phase === "error" ? (
        <div className="row-actions">
          <button type="button" className="btn btn-pri" onClick={onReset}>
            New payment
          </button>
          {phase === "error" && auth.status === "failed" && !auth.txHash ? (
            <button type="button" className="btn btn-sec" onClick={onRetry}>
              Retry from wallet
            </button>
          ) : null}
          <Link className="btn btn-sec" to="/app/activity">
            Activity
          </Link>
          <Badge tone={auth.status === "settled" ? "ok" : auth.status === "failed" ? "bad" : "info"}>{auth.status}</Badge>
        </div>
      ) : null}
    </Card>
  );
}
