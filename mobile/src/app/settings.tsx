import { useState } from "react";
import { Alert, Pressable, ScrollView, StyleSheet, Switch, TextInput, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { useAppKit } from "@reown/appkit-react-native";
import { useSwitchChain } from "wagmi";
import { Button, Card, CardHead, Em, Label, Notice, Row, Text, TokenAvatar } from "@/ui";
import { usePortfolio, useWallet } from "@/hooks/data";
import { CHAINS } from "@/lib/chains";
import { humanError } from "@/lib/errors";
import { shortAddr } from "@/lib/format";
import { parseAmount } from "@/lib/protocol";
import { clearWallet, limitKey, setPolicy, useWalletData } from "@/lib/store";
import type { Holding } from "@/lib/data";
import { colors, fonts, radius } from "@/theme/tokens";

/** Settings sheet: account, network, spending rules, and sign-out. */
export default function Settings() {
  const w = useWallet();
  const { disconnect } = useAppKit();
  const { switchChainAsync, isPending } = useSwitchChain();
  const { data } = useWalletData(w.address);
  const portfolio = usePortfolio(w.chainId, w.address);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState<string | null>(null);
  // Limits are set per asset; the six largest holdings on this network are offered.
  const assets = (portfolio.data?.holdings ?? []).filter((h) => h.raw > 0n).slice(0, 6);

  return (
    <ScrollView style={styles.sheet} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <View style={styles.head}>
        <Label>Account</Label>
        <Text variant="display" style={styles.title}>
          Account <Em>settings.</Em>
        </Text>
      </View>

      {error ? <Notice tone="bad">{error}</Notice> : null}

      <Card>
        <CardHead label="Signed in" title={w.connectorName ?? "Wallet"} />
        <Row
          first
          k="Address"
          v={
            <Pressable
              onPress={async () => {
                if (!w.address) return;
                await Clipboard.setStringAsync(w.address);
                setCopied(true);
                setTimeout(() => setCopied(false), 1400);
              }}
              accessibilityHint="Copies your address"
            >
              <Text variant="mono">{copied ? "Copied" : shortAddr(w.address)}</Text>
            </Pressable>
          }
        />
      </Card>

      <Card>
        <CardHead label="Network" title="Where you pay" />
        <View style={styles.nets}>
          {Object.values(CHAINS).map((c) => {
            const on = c.id === w.chainId && !w.unsupported;
            return (
              <Pressable
                key={c.id}
                disabled={on || isPending}
                onPress={async () => {
                  setError(null);
                  try {
                    await switchChainAsync({ chainId: c.id });
                  } catch (e) {
                    setError(humanError(e));
                  }
                }}
                style={[styles.net, on ? styles.netOn : null]}
                accessibilityRole="radio"
                accessibilityState={{ selected: on }}
              >
                <View style={[styles.dot, on ? styles.dotOn : null]} />
                <Text variant="strong">{c.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </Card>

      <Card>
        <CardHead label="Spending controls" title="Daily limits" />
        <Text variant="muted">A rolling 24-hour cap per asset. Payments that would pass it are refused before you sign.</Text>
        {assets.length ? (
          assets.map((h, i) => <LimitRow key={h.token} h={h} first={i === 0} address={w.address!} chainId={w.chainId} current={data.policy.dailyLimits[limitKey(w.chainId, h.token)]} />)
        ) : (
          <Text variant="faint">{portfolio.isLoading ? "Loading your balances…" : "No assets on this network to limit yet."}</Text>
        )}
        <View style={styles.toggle}>
          <View style={styles.toggleText}>
            <Text variant="strong">Allowlist only</Text>
            <Text variant="faint">Refuse payments to anyone not on your merchant list ({data.policy.merchants.length} saved).</Text>
          </View>
          <Switch
            value={data.policy.allowlistOnly}
            onValueChange={(v) => w.address && setPolicy(w.address, (p) => ({ ...p, allowlistOnly: v }))}
            trackColor={{ true: colors.accent, false: colors.bg3 }}
            thumbColor={colors.fg}
            accessibilityLabel="Allowlist only"
          />
        </View>
      </Card>

      <View style={styles.bottom}>
        <Button label="Sign out" variant="line" onPress={() => disconnect()} />
        <Button
          label="Clear data on this phone"
          variant="ghost"
          onPress={() =>
            Alert.alert("Clear local data?", "Your card, limits and payment history are removed from this phone. Nothing on-chain changes.", [
              { text: "Cancel", style: "cancel" },
              { text: "Clear", style: "destructive", onPress: () => w.address && clearWallet(w.address) },
            ])
          }
        />
      </View>
    </ScrollView>
  );
}

function LimitRow({ h, first, address, chainId, current }: { h: Holding; first: boolean; address: string; chainId: number; current: string | undefined }) {
  // Draft is the user's typing; until they type, the saved limit shows.
  const [draft, setDraft] = useState<string | undefined>(undefined);
  const value = draft ?? current ?? "";
  const valid = value === "" || parseAmount(value, h.decimals) != null;
  const dirty = draft !== undefined && draft !== (current ?? "");

  function save() {
    if (!valid) return;
    setPolicy(address, (p) => {
      const dailyLimits = { ...p.dailyLimits };
      if (value === "") delete dailyLimits[limitKey(chainId, h.token)];
      else dailyLimits[limitKey(chainId, h.token)] = value;
      return { ...p, dailyLimits };
    });
    setDraft(undefined);
  }

  return (
    <View style={[styles.limit, first ? null : styles.limitRule]}>
      <TokenAvatar symbol={h.symbol} address={h.token} icon={h.icon} size={28} />
      <Text variant="strong" style={styles.limitSym} numberOfLines={1}>
        {h.symbol}
      </Text>
      <TextInput
        value={value}
        onChangeText={setDraft}
        placeholder="No limit"
        placeholderTextColor={colors.fg3}
        keyboardType="decimal-pad"
        style={[styles.limitInput, valid ? null : styles.limitBad]}
        accessibilityLabel={`Daily limit for ${h.symbol}`}
      />
      <Button label="Save" size="sm" variant={dirty ? "jade" : "line"} disabled={!dirty || !valid} onPress={save} />
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: { flex: 1, backgroundColor: colors.bg2 },
  content: { padding: 20, paddingTop: 28, gap: 16, paddingBottom: 48 },
  head: { gap: 12 },
  title: { fontSize: 34, lineHeight: 38 },
  nets: { gap: 8 },
  net: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 14,
    height: 48,
    borderRadius: radius.md,
    borderCurve: "continuous",
    borderWidth: 1,
    borderColor: colors.line,
  },
  netOn: { borderColor: colors.accent, backgroundColor: colors.accentSoft },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: colors.fg3 },
  dotOn: { backgroundColor: colors.accent },
  limit: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 10 },
  limitRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  limitSym: { width: 64, flexShrink: 0 },
  limitInput: {
    flex: 1,
    minWidth: 0,
    height: 38,
    paddingHorizontal: 12,
    borderRadius: radius.sm,
    borderWidth: 1,
    borderColor: colors.line,
    color: colors.fg,
    fontFamily: fonts.mono,
    fontSize: 14,
  },
  limitBad: { borderColor: "rgba(255, 122, 112, 0.6)" },
  toggle: { flexDirection: "row", alignItems: "center", gap: 12, paddingTop: 4 },
  toggleText: { flex: 1, gap: 2 },
  bottom: { gap: 8, paddingTop: 8 },
});
