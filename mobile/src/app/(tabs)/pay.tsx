import { useCallback, useMemo, useState } from "react";
import { Pressable, StyleSheet, TextInput, View } from "react-native";
import { FlashList, type ListRenderItem } from "@shopify/flash-list";
import { router } from "expo-router";
import { openBrowserAsync } from "expo-web-browser";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useSendTransaction, useSignTypedData, useSwitchChain, useWriteContract } from "wagmi";
import { erc20Abi, getAddress, type Hex } from "viem";
import { normalize } from "viem/ens";
import { Button, Card, CardHead, Em, Notice, PageHead, Row, Screen, Text, TokenAvatar } from "@/ui";
import { usePortfolio, useWallet } from "@/hooks/data";
import { chainMeta, txUrl } from "@/lib/chains";
import { publicClient } from "@/lib/clients";
import type { Holding } from "@/lib/data";
import { RELAYER_URL } from "@/lib/env";
import { humanError, isUserRejection } from "@/lib/errors";
import { fmtAmount, shortAddr } from "@/lib/format";
import { AUTH_TTL_MS, checkPolicy, domain, isNative, newDraft, parseAmount, PAYMENT_TYPES, paymentMessage, submitToRelayer } from "@/lib/protocol";
import { addAuthorization, patchAuthorization, useWalletData, type Authorization } from "@/lib/store";
import { colors, fonts, radius } from "@/theme/tokens";

const MAX_ASSETS = 24;

type Phase = "form" | "signing" | "settling" | "confirming" | "done" | "error";

const PHASE_TEXT: Record<Phase, string> = {
  form: "",
  signing: "Waiting for your signature…",
  settling: RELAYER_URL ? "Handing the authorization to the relayer…" : "Confirm the transfer in your wallet…",
  confirming: "Waiting for the network to confirm…",
  done: "Payment settled.",
  error: "Payment stopped.",
};

/** Authorize a payment: policy checks, one EIP-712 signature, then settlement. */
export default function Pay() {
  const w = useWallet();
  const { data } = useWalletData(w.address);
  const portfolio = usePortfolio(w.chainId, w.address);
  const qc = useQueryClient();
  const { signTypedDataAsync } = useSignTypedData();
  const { sendTransactionAsync } = useSendTransaction();
  const { writeContractAsync } = useWriteContract();
  const { switchChainAsync } = useSwitchChain();

  const [recipientInput, setRecipientInput] = useState("");
  const [tokenAddr, setTokenAddr] = useState<string | undefined>(undefined);
  const [amountInput, setAmountInput] = useState("");
  const [phase, setPhase] = useState<Phase>("form");
  const [current, setCurrent] = useState<Authorization | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Holdings come sorted by value; wallets collect thousands of unsolicited airdrops,
  // so only the largest ones are offered as something to pay with.
  const allHeld = useMemo(() => (portfolio.data?.holdings ?? []).filter((h) => h.raw > 0n), [portfolio.data]);
  const holdings = useMemo(() => allHeld.slice(0, MAX_ASSETS), [allHeld]);
  // Until the user picks, the first holding is selected (state holds intent only).
  const token = holdings.find((h) => tokenAddr && h.token.toLowerCase() === tokenAddr.toLowerCase()) ?? holdings[0] ?? null;

  // ENS names resolve on Ethereum whatever network the payment is on.
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

  const renderAsset: ListRenderItem<Holding> = useCallback(
    ({ item }) => <AssetOption h={item} selected={item.token === token?.token} onSelect={setTokenAddr} />,
    [token?.token],
  );

  async function settle(auth: Authorization) {
    const addr = w.address!;
    setPhase("settling");
    try {
      let hash: Hex | undefined;
      if (RELAYER_URL) {
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
      void qc.invalidateQueries({ queryKey: ["portfolio", auth.chainId] });
      void qc.invalidateQueries({ queryKey: ["activity", auth.chainId] });
    } catch (e) {
      const msg = humanError(e);
      patchAuthorization(addr, auth.id, { status: "failed", error: msg });
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
      signature,
      status: "signed",
    };
    addAuthorization(w.address, auth);
    setCurrent(auth);
    await settle(auth);
  }

  function reset() {
    setPhase("form");
    setCurrent(null);
    setError(null);
    setAmountInput("");
  }

  const head = (
    <PageHead
      label="Banking"
      title={
        <>
          Authorize a <Em>payment.</Em>
        </>
      }
      sub={`Checked against your spending rules before anything leaves ${chainMeta(w.chainId).short}.`}
    />
  );

  if (!data.credential) {
    return (
      <Screen>
        {head}
        <Card>
          <CardHead label="First" title="Issue your credential" />
          <Text variant="muted">Every CassaFi payment is authorized with your credential. Issuing it takes one signature and doesn&apos;t move funds.</Text>
          <Button label="Get your card" onPress={() => router.navigate("/card")} />
        </Card>
      </Screen>
    );
  }

  if (phase !== "form" && current) {
    return (
      <Screen>
        {head}
        <Card style={styles.progress}>
          <Text variant="label" tone={phase === "error" ? "danger" : "accent"}>
            {phase === "done" ? "Payment complete" : phase === "error" ? "Payment stopped" : "In progress"}
          </Text>
          <Text variant="figure" adjustsFontSizeToFit numberOfLines={1}>
            {fmtAmount(BigInt(current.amount), current.token.decimals)} {current.token.symbol}
          </Text>
          <Text variant="muted">to {shortAddr(current.recipient)}</Text>
          <Text>{PHASE_TEXT[phase]}</Text>
          {error ? <Notice tone="bad">{error}</Notice> : null}
          <View style={styles.actions}>
            {current.txHash ? (
              <Button label="View transaction" variant="line" size="sm" onPress={() => openBrowserAsync(txUrl(current.chainId, current.txHash!))} />
            ) : null}
            {phase === "done" || phase === "error" ? <Button label="New payment" size="sm" onPress={reset} /> : null}
          </View>
        </Card>
      </Screen>
    );
  }

  return (
    <Screen>
      {head}
      {error ? <Notice tone="bad">{error}</Notice> : null}

      <Card>
        <CardHead label="Payment" title="Details" />
        <Text variant="label">Recipient</Text>
        <TextInput
          value={recipientInput}
          onChangeText={setRecipientInput}
          placeholder="0x… or name.eth"
          placeholderTextColor={colors.fg3}
          autoCapitalize="none"
          autoCorrect={false}
          style={styles.input}
          accessibilityLabel="Recipient address or ENS name"
        />
        {ensName && ens.data ? <Text variant="faint">Resolves to {shortAddr(ens.data)}</Text> : null}

        <Text variant="label">Asset</Text>
        {holdings.length ? (
          <>
            <FlashList
              horizontal
              data={holdings}
              renderItem={renderAsset}
              keyExtractor={assetKey}
              extraData={token?.token}
              showsHorizontalScrollIndicator={false}
              ItemSeparatorComponent={AssetGap}
            />
            {allHeld.length > MAX_ASSETS ? <Text variant="faint">Showing your {MAX_ASSETS} largest holdings.</Text> : null}
          </>
        ) : (
          <Text variant="faint">{portfolio.isLoading ? "Loading your balances…" : "This address holds nothing to pay with yet."}</Text>
        )}

        <Text variant="label">Amount</Text>
        <View style={styles.amountRow}>
          <TextInput
            value={amountInput}
            onChangeText={setAmountInput}
            placeholder="0.00"
            placeholderTextColor={colors.fg3}
            keyboardType="decimal-pad"
            style={[styles.input, styles.amountInput]}
            accessibilityLabel={`Amount in ${token?.symbol ?? "the selected asset"}`}
          />
          {token ? (
            <Button
              label="Max"
              variant="line"
              size="sm"
              onPress={() => setAmountInput(fmtAmount(token.raw, token.decimals, token.decimals).replace(/,/g, "").replace(/^</, ""))}
            />
          ) : null}
        </View>
      </Card>

      <Card>
        <CardHead label="Credential" title="Policy checks" />
        {issues.length ? (
          issues.map((i) => (
            <Text key={i.text} tone={i.level === "block" ? "danger" : "warning"}>
              {i.level === "block" ? "✕ " : "! "}
              {i.text}
            </Text>
          ))
        ) : (
          <Text tone="accent">✓ Every rule passes.</Text>
        )}
        <View>
          <Row first k="Settles by" v={RELAYER_URL ? "Relayer (gasless)" : "Your wallet"} />
          <Row k="Valid for" v="15 minutes after signing" />
        </View>
      </Card>

      <Button label="Authorize payment" disabled={blocked} onPress={authorize} />
    </Screen>
  );
}

const assetKey = (h: Holding) => h.token;

function AssetGap() {
  return <View style={styles.assetGap} />;
}

function AssetOption({ h, selected, onSelect }: { h: Holding; selected: boolean; onSelect: (address: string) => void }) {
  return (
    <Pressable
      onPress={() => onSelect(h.token)}
      style={[styles.asset, selected ? styles.assetOn : null]}
      accessibilityRole="radio"
      accessibilityState={{ selected }}
      accessibilityLabel={`${h.symbol}, balance ${fmtAmount(h.raw, h.decimals)}`}
    >
      <TokenAvatar symbol={h.symbol} address={h.token} icon={h.icon} size={28} />
      <View>
        <Text variant="strong" numberOfLines={1}>
          {h.symbol}
        </Text>
        <Text variant="faint" numberOfLines={1}>
          {fmtAmount(h.raw, h.decimals)}
        </Text>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 50,
    paddingHorizontal: 14,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
    color: colors.fg,
    fontFamily: fonts.sans,
    fontSize: 16,
  },
  amountRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  amountInput: { flex: 1, fontFamily: fonts.mono },
  asset: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
    minWidth: 128,
  },
  assetOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  assetGap: { width: 8 },
  progress: { gap: 12 },
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
});
