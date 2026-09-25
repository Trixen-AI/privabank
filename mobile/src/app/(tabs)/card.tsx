import { useState } from "react";
import { Alert, StyleSheet, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useSignTypedData, useSwitchChain } from "wagmi";
import { BankCard, Button, Card, CardHead, Em, Notice, PageHead, Row, Screen, Text } from "@/ui";
import { useWallet } from "@/hooks/data";
import { deriveCard, normalizeHolder } from "@/lib/card";
import { chainMeta } from "@/lib/chains";
import { humanError } from "@/lib/errors";
import { fmtDate, shortAddr } from "@/lib/format";
import { CREDENTIAL_STATEMENT, CREDENTIAL_TYPES, credentialMessage, deriveCredential, domain, verifyCredentialSignature } from "@/lib/protocol";
import { setCredential, useWalletData } from "@/lib/store";
import { colors, fonts, radius } from "@/theme/tokens";

type Check = { tone: "info" | "warn" | "bad"; text: string } | null;

/** The card and the spending credential behind it: issue, verify, revoke on this phone. */
export default function CardScreen() {
  const w = useWallet();
  const { data } = useWalletData(w.address);
  const { signTypedDataAsync } = useSignTypedData();
  const { switchChainAsync } = useSwitchChain();
  const [name, setName] = useState("");
  const [nameErr, setNameErr] = useState<string | null>(null);
  const [busy, setBusy] = useState<"issue" | "verify" | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [check, setCheck] = useState<Check>(null);
  const c = data.credential;

  async function sign(chainId: number) {
    if (w.walletChain !== chainId) await switchChainAsync({ chainId });
    return signTypedDataAsync({
      domain: domain(chainId),
      types: CREDENTIAL_TYPES,
      primaryType: "Credential",
      message: credentialMessage(w.address!, chainId),
    });
  }

  async function issue() {
    if (!w.address) return;
    // The name comes first: nothing is signed until it's valid.
    const holder = normalizeHolder(name);
    if (holder.error) return setNameErr(holder.error);
    setNameErr(null);
    setError(null);
    setBusy("issue");
    try {
      const chainId = w.chainId;
      const sig = await sign(chainId);
      if (!(await verifyCredentialSignature(w.address, chainId, sig))) throw new Error("The signature didn't verify against this address.");
      const { id, commitment } = deriveCredential(sig, w.address, chainId);
      setCredential(w.address, {
        id,
        commitment,
        chainId,
        issuedAt: Date.now(),
        method: w.connectorName ?? "Wallet",
        deterministic: null,
        holderName: holder.value,
      });
    } catch (e) {
      setError(humanError(e));
    } finally {
      setBusy(null);
    }
  }

  /** Signs the same statement again: proves this wallet still controls the credential. */
  async function verify() {
    if (!w.address || !c) return;
    setBusy("verify");
    setCheck(null);
    try {
      const sig = await sign(c.chainId);
      if (!(await verifyCredentialSignature(w.address, c.chainId, sig))) {
        setCheck({ tone: "bad", text: "The signature didn't verify for this address." });
        return;
      }
      const same = deriveCredential(sig, w.address, c.chainId).id === c.id;
      setCredential(w.address, { ...c, deterministic: same });
      setCheck(
        same
          ? { tone: "info", text: "Verified. Your wallet re-derived the same credential ID." }
          : { tone: "warn", text: "Signature valid, but your wallet signs differently each time, so the ID stays tied to the original signature." },
      );
    } catch (e) {
      setCheck({ tone: "bad", text: humanError(e) });
    } finally {
      setBusy(null);
    }
  }

  function revoke() {
    if (!w.address || !c) return;
    Alert.alert("Remove this card?", "The credential and card are removed from this phone. You can issue a new one at any time.", [
      { text: "Cancel", style: "cancel" },
      { text: "Remove", style: "destructive", onPress: () => setCredential(w.address!, null) },
    ]);
  }

  return (
    <Screen>
      <PageHead
        label="Privacy & control"
        title={
          <>
            Card & <Em>credential.</Em>
          </>
        }
        sub="Your credential authorizes spending. It proves permission to pay, and it comes from one signature that never moves funds."
      />

      {error ? <Notice tone="bad">{error}</Notice> : null}

      {c?.holderName ? (
        <>
          <BankCard card={deriveCard(c.id, c.issuedAt)} holder={c.holderName} />
          {check ? <Notice tone={check.tone}>{check.text}</Notice> : null}
          <Card>
            <CardHead label="Details" title="Active" />
            <View>
              <Row first k="Card holder" v={c.holderName} />
              <Row
                k="Credential ID"
                v={
                  <Text variant="mono" onPress={() => Clipboard.setStringAsync(c.id)} accessibilityHint="Copies the credential ID">
                    {shortAddr(c.id, 10, 6)}
                  </Text>
                }
              />
              <Row k="Network" v={chainMeta(c.chainId).name} />
              <Row k="Issued" v={fmtDate(c.issuedAt)} />
              <Row k="Signed in with" v={c.method} />
            </View>
            <View style={styles.actions}>
              <Button label="Verify ownership" variant="line" size="sm" busy={busy === "verify"} onPress={verify} />
              <Button label="Remove from this phone" variant="ghost" size="sm" onPress={revoke} />
            </View>
          </Card>
        </>
      ) : (
        <Card>
          <CardHead label="New credential" title="Issue your spending credential" />
          <Step n={1} title="Enter the name for your card." body="It's printed on your CassaFi card." />
          <TextInput
            value={name}
            onChangeText={(t) => {
              setName(t);
              if (nameErr) setNameErr(null);
            }}
            placeholder="Full name"
            placeholderTextColor={colors.fg3}
            autoCapitalize="words"
            autoComplete="name"
            textContentType="name"
            maxLength={26}
            style={[styles.input, nameErr ? styles.inputBad : null]}
            accessibilityLabel="Name on card"
          />
          {nameErr ? <Text tone="danger">{nameErr}</Text> : null}
          <Step n={2} title="You sign one statement." body="Your wallet shows exactly this text:" />
          <Text style={styles.statement}>{CREDENTIAL_STATEMENT}</Text>
          <Step n={3} title="Your card is issued." body="A CassaFi card tied to the credential, ready to authorize payments." />
          <Button label="Issue credential & card" busy={busy === "issue"} onPress={issue} />
        </Card>
      )}
    </Screen>
  );
}

function Step({ n, title, body }: { n: number; title: string; body: string }) {
  return (
    <View style={styles.step}>
      <View style={styles.stepN}>
        <Text style={styles.stepNText}>{n}</Text>
      </View>
      <Text style={styles.stepText}>
        <Text variant="strong">{title}</Text> <Text variant="muted">{body}</Text>
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  actions: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
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
  inputBad: { borderColor: "rgba(255, 122, 112, 0.6)" },
  statement: {
    fontSize: 14,
    lineHeight: 20,
    padding: 14,
    backgroundColor: colors.bg3,
    borderRadius: radius.sm,
    borderLeftWidth: 2,
    borderLeftColor: colors.accent,
  },
  step: { flexDirection: "row", gap: 12, alignItems: "flex-start" },
  stepN: { width: 24, height: 24, borderRadius: 12, backgroundColor: colors.accentSoft, alignItems: "center", justifyContent: "center" },
  stepNText: { fontFamily: fonts.monoMedium, fontSize: 12, color: colors.accent },
  stepText: { flex: 1 },
});
