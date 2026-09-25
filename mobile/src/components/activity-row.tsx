import { memo } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import { openBrowserAsync } from "expo-web-browser";
import { SymbolView } from "expo-symbols";
import { Text, TokenAvatar } from "@/ui";
import type { ActivityItem } from "@/lib/data";
import { txUrl } from "@/lib/chains";
import { fmtAgo, fmtAmount, shortAddr } from "@/lib/format";
import { colors, fonts, radius } from "@/theme/tokens";

const TITLE: Record<ActivityItem["direction"], string> = { in: "Received", out: "Sent", self: "Moved" };

/**
 * One on-chain event. Memoised and fed only primitive-stable props, so a list
 * re-render doesn't re-render rows that didn't change. Opens the transaction
 * in the explorer.
 */
export const ActivityRow = memo(function ActivityRow({ item }: { item: ActivityItem }) {
  const title = item.kind === "call" ? (item.method ?? "Contract call") : TITLE[item.direction];
  const incoming = item.direction === "in";
  const amount = item.token && item.amount > 0n ? `${incoming ? "+" : "−"}${fmtAmount(item.amount, item.token.decimals)} ${item.token.symbol}` : null;
  const who = item.counterparty ? `${incoming ? "from" : "to"} ${shortAddr(item.counterparty)}` : "";

  return (
    <Pressable
      onPress={() => openBrowserAsync(txUrl(item.chainId, item.hash))}
      style={({ pressed }) => [styles.row, pressed ? styles.pressed : null]}
      accessibilityRole="link"
      accessibilityLabel={`${title} ${amount ?? ""} ${who}, ${fmtAgo(item.timestamp)}. Open in explorer`}
    >
      {item.token ? (
        <TokenAvatar symbol={item.token.symbol} address={item.token.address} size={38} />
      ) : (
        <View style={styles.ico}>
          <SymbolView name="function" size={16} tintColor={colors.fg2} fallback={<Text style={styles.icoText}>ƒ</Text>} />
        </View>
      )}
      <View style={styles.main}>
        <Text variant="strong" numberOfLines={1}>
          {title}
          {item.status === "failed" ? <Text tone="danger"> · failed</Text> : null}
        </Text>
        <Text variant="faint" numberOfLines={1}>
          {who ? `${who} · ` : ""}
          {fmtAgo(item.timestamp)}
        </Text>
      </View>
      {amount ? (
        <Text style={[styles.amt, incoming ? styles.amtIn : null]} numberOfLines={1}>
          {amount}
        </Text>
      ) : null}
    </Pressable>
  );
});

const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12, paddingVertical: 12 },
  pressed: { opacity: 0.6 },
  ico: { width: 38, height: 38, borderRadius: radius.pill, backgroundColor: colors.bg3, alignItems: "center", justifyContent: "center" },
  icoText: { color: colors.fg2 },
  main: { flex: 1, gap: 2 },
  amt: { fontFamily: fonts.mono, fontSize: 14, maxWidth: "45%" },
  amtIn: { color: colors.accent },
});
