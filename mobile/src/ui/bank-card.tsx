import { useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import * as Clipboard from "expo-clipboard";
import { SvgXml } from "react-native-svg";
import { colors, fonts, radius } from "@/theme/tokens";
import { groupCard, type BankCardData, type CardNetwork } from "@/lib/card";
import { Logomark, Wordmark } from "./logo";
import { Text } from "./text";
import { DISCOVER_SVG, MASTERCARD_SVG, VISA_SVG } from "./generated/network-marks";

/*
 * Card network marks, unmodified. On the dark card Visa and Discover use their
 * reversed (white) variants, exactly as the web app does with CSS: Visa's blue
 * becomes white, Discover's dark wordmark becomes white, the orange stays.
 * The Mastercard file sets width/height but no viewBox; the viewBox added here
 * is its own 1000x618 canvas, so it only lets the mark scale.
 */
const MARKS: Record<CardNetwork, { xml: string; w: number; h: number }> = {
  visa: { xml: VISA_SVG.replace(/#1434cb/gi, "#ffffff"), w: 52, h: 17 },
  mastercard: { xml: MASTERCARD_SVG.replace("<svg ", '<svg viewBox="0 0 1000 618" '), w: 46, h: 28 },
  discover: { xml: DISCOVER_SVG.replace(/fill:#201d1c/gi, "fill:#ffffff"), w: 74, h: 13 },
};

/** The CassaFi card: ID-1 proportions (85.6 x 54 mm), number masked until the holder asks. */
export function BankCard({ card, holder, showControls = true }: { card: BankCardData; holder: string; showControls?: boolean }) {
  const [revealed, setRevealed] = useState(false);
  const [copied, setCopied] = useState(false);
  const mark = MARKS[card.network];

  return (
    <View style={styles.wrap}>
      <View style={styles.card} accessible accessibilityLabel={`CassaFi card ending ${card.last4}, ${holder}`}>
        <View style={styles.top}>
          <View style={styles.brand}>
            <Logomark size={24} />
            <Wordmark height={15} />
          </View>
          <Text variant="label" style={styles.kind}>
            Private
          </Text>
        </View>

        <View style={styles.chip} />

        <Text style={styles.number} selectable={revealed}>
          {revealed ? groupCard(card.number) : `••••  ••••  ••••  ${card.last4}`}
        </Text>

        <View style={styles.foot}>
          <View style={styles.footCol}>
            <Text variant="label" style={styles.k}>
              Card holder
            </Text>
            <Text style={styles.v} numberOfLines={1}>
              {holder.toUpperCase()}
            </Text>
          </View>
          <View style={styles.footCol}>
            <Text variant="label" style={styles.k}>
              Valid thru
            </Text>
            <Text style={styles.v}>{card.expiry}</Text>
          </View>
          {revealed ? (
            <View style={styles.footCol}>
              <Text variant="label" style={styles.k}>
                CVV
              </Text>
              <Text style={styles.v}>{card.cvv}</Text>
            </View>
          ) : null}
          <View style={styles.net}>
            <SvgXml xml={mark.xml} width={mark.w} height={mark.h} />
          </View>
        </View>
      </View>

      {showControls ? (
        <View style={styles.controls}>
          <Pressable style={({ pressed }) => [styles.ctl, pressed ? styles.ctlPressed : null]} onPress={() => setRevealed((v) => !v)}>
            <Text style={styles.ctlText}>{revealed ? "Hide details" : "Show details"}</Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.ctl, pressed ? styles.ctlPressed : null]}
            onPress={async () => {
              await Clipboard.setStringAsync(card.number);
              setCopied(true);
              setTimeout(() => setCopied(false), 1400);
            }}
          >
            <Text style={styles.ctlText}>{copied ? "Copied" : "Copy number"}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 12 },
  card: {
    aspectRatio: 1.586,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: 20,
    justifyContent: "space-between",
    overflow: "hidden",
    backgroundColor: "#0b1512",
    experimental_backgroundImage:
      "radial-gradient(circle at 100% 0%, rgba(32, 205, 153, 0.38), transparent 55%), linear-gradient(150deg, #10201b, #07090a 58%, #032a20)",
    borderWidth: StyleSheet.hairlineWidth,
    borderColor: "rgba(255, 255, 255, 0.12)",
    boxShadow: "0 24px 48px rgba(0, 0, 0, 0.45)",
  },
  top: { flexDirection: "row", alignItems: "center", justifyContent: "space-between" },
  brand: { flexDirection: "row", alignItems: "center", gap: 6 },
  kind: { color: "rgba(255, 255, 255, 0.6)", fontSize: 10 },
  chip: {
    width: 42,
    height: 32,
    borderRadius: 6,
    backgroundColor: "#b9ccc5",
    experimental_backgroundImage: "linear-gradient(135deg, #d9e6e1, #9fb8af 45%, #e8f1ee 70%, #a8bfb7)",
  },
  number: { fontFamily: fonts.monoMedium, fontSize: 19, letterSpacing: 1.5, color: "#ffffff" },
  foot: { flexDirection: "row", alignItems: "flex-end", gap: 18 },
  footCol: { gap: 3, flexShrink: 1 },
  k: { fontSize: 9, color: "rgba(255, 255, 255, 0.55)" },
  v: { fontFamily: fonts.sansMedium, fontSize: 14, color: "#ffffff", letterSpacing: 0.6 },
  net: { marginLeft: "auto" },
  controls: { flexDirection: "row", gap: 8 },
  ctl: {
    height: 36,
    paddingHorizontal: 14,
    borderRadius: radius.pill,
    borderWidth: 1,
    borderColor: colors.lineStrong,
    justifyContent: "center",
  },
  ctlPressed: { opacity: 0.7 },
  ctlText: { fontFamily: fonts.sansMedium, fontSize: 14 },
});
