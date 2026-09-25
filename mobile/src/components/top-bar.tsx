import { Pressable, StyleSheet, View } from "react-native";
import { router } from "expo-router";
import { useAppKit } from "@reown/appkit-react-native";
import { SymbolView } from "expo-symbols";
import { Logomark, Text, Wordmark } from "@/ui";
import { useWallet } from "@/hooks/data";
import { chainMeta } from "@/lib/chains";
import { colors, fonts, radius } from "@/theme/tokens";

/** The website header, as an app bar: lockup left, network pill and settings right. */
export function TopBar() {
  const { open } = useAppKit();
  const w = useWallet();
  const chain = chainMeta(w.chainId);

  return (
    <View style={styles.bar}>
      <View style={styles.brand} accessibilityRole="header" accessibilityLabel="CassaFi">
        <Logomark size={28} />
        <Wordmark height={17} />
      </View>
      <View style={styles.actions}>
        <Pressable
          onPress={() => open({ view: "Networks" })}
          style={({ pressed }) => [styles.pill, w.unsupported ? styles.pillBad : null, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel={`Network: ${w.unsupported ? "unsupported" : chain.name}. Change network`}
        >
          <View style={[styles.dot, w.unsupported ? styles.dotBad : null]} />
          <Text style={styles.pillText}>{w.unsupported ? "Unsupported" : chain.short}</Text>
        </Pressable>
        <Pressable
          onPress={() => router.push("/settings")}
          style={({ pressed }) => [styles.round, pressed ? styles.pressed : null]}
          accessibilityRole="button"
          accessibilityLabel="Settings"
        >
          <SymbolView name="gearshape" size={18} tintColor={colors.fg2} fallback={<Text style={styles.gear}>⚙</Text>} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingVertical: 6 },
  brand: { flexDirection: "row", alignItems: "center", gap: 6 },
  actions: { flexDirection: "row", alignItems: "center", gap: 8 },
  pill: {
    height: 38,
    paddingHorizontal: 13,
    borderRadius: radius.pill,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bg2,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  pillBad: { borderColor: "rgba(255, 122, 112, 0.45)" },
  pillText: { fontFamily: fonts.sansMedium, fontSize: 14 },
  dot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.accent },
  dotBad: { backgroundColor: colors.danger },
  round: {
    width: 38,
    height: 38,
    borderRadius: 19,
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: colors.lineStrong,
    backgroundColor: colors.bg2,
    alignItems: "center",
    justifyContent: "center",
  },
  gear: { color: colors.fg2, fontSize: 16 },
  pressed: { opacity: 0.7 },
});
