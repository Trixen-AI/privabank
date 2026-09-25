import { ActivityIndicator, Pressable, StyleSheet, View, type PressableProps, type ViewProps } from "react-native";
import { colors, fonts, radius } from "@/theme/tokens";
import { Text } from "./text";

/* The website's building blocks, as native views. */

/** Mono label with the jade dot: the website's section label. */
export function Label({ children, tone = "fg2" }: { children: string; tone?: "fg2" | "accent" }) {
  return (
    <View style={styles.label}>
      <View style={styles.dot} />
      <Text variant="label" style={tone === "accent" ? styles.labelAccent : null}>
        {children}
      </Text>
    </View>
  );
}

/** Night tile: raised surface, hairline edge, soft 20px corners. */
export function Card({ style, ...rest }: ViewProps) {
  return <View {...rest} style={[styles.card, style]} />;
}

/** Mono overline and title at the top of a card. */
export function CardHead({ label, title, right }: { label: string; title?: string; right?: React.ReactNode }) {
  return (
    <View style={styles.cardHead}>
      <View style={styles.cardHeadText}>
        <Text variant="label" tone="accent">
          {label}
        </Text>
        {title ? <Text variant="title">{title}</Text> : null}
      </View>
      {right ?? null}
    </View>
  );
}

type ButtonProps = Omit<PressableProps, "children" | "style"> & {
  label: string;
  variant?: "jade" | "line" | "ghost";
  size?: "md" | "sm";
  busy?: boolean;
  icon?: React.ReactNode;
};

/** Pill button: jade for the one action that matters, a hairline outline for the rest. */
export function Button({ label, variant = "jade", size = "md", busy = false, icon, disabled, ...rest }: ButtonProps) {
  const off = disabled || busy;
  return (
    <Pressable
      {...rest}
      disabled={off}
      accessibilityRole="button"
      accessibilityState={{ disabled: !!off, busy }}
      style={({ pressed }) => [
        styles.btn,
        size === "sm" ? styles.btnSm : null,
        variant === "jade" ? styles.btnJade : variant === "line" ? styles.btnLine : styles.btnGhost,
        pressed ? styles.btnPressed : null,
        off ? styles.btnOff : null,
      ]}
    >
      {busy ? <ActivityIndicator size="small" color={variant === "jade" ? colors.onAccent : colors.fg} /> : icon ?? null}
      <Text style={[styles.btnText, size === "sm" ? styles.btnTextSm : null]} tone={variant === "jade" ? "onAccent" : undefined}>
        {label}
      </Text>
    </Pressable>
  );
}

export function Badge({ children, tone = "muted" }: { children: string; tone?: "ok" | "warn" | "bad" | "muted" }) {
  return (
    <View style={[styles.badge, badgeTone[tone]]}>
      <Text variant="label" style={[styles.badgeText, badgeText[tone]]}>
        {children}
      </Text>
    </View>
  );
}

export function Notice({ tone = "info", children }: { tone?: "info" | "warn" | "bad"; children: string }) {
  return (
    <View style={[styles.notice, noticeTone[tone]]} accessibilityRole={tone === "bad" ? "alert" : undefined}>
      <Text style={[styles.noticeText, noticeText[tone]]}>{children}</Text>
    </View>
  );
}

/** A key/value row with a hairline above it. */
export function Row({ k, v, first = false }: { k: string; v: React.ReactNode; first?: boolean }) {
  return (
    <View style={[styles.row, first ? null : styles.rowRule]}>
      <Text variant="muted" style={styles.rowK}>
        {k}
      </Text>
      {typeof v === "string" ? (
        <Text style={styles.rowV} numberOfLines={1}>
          {v}
        </Text>
      ) : (
        v
      )}
    </View>
  );
}

export function Meter({ value, max }: { value: number; max: number }) {
  const pct = max > 0 ? Math.min(1, value / max) : 0;
  const tone = pct >= 1 ? colors.danger : pct >= 0.8 ? colors.warning : colors.accent;
  return (
    <View style={styles.meter} accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(pct * 100) }}>
      {/* Width by transform, not layout: the bar grows without re-laying-out its row. */}
      <View style={[styles.meterFill, { backgroundColor: tone, transform: [{ scaleX: pct }] }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  label: { flexDirection: "row", alignItems: "center", gap: 10 },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent },
  labelAccent: { color: colors.accent },

  card: {
    backgroundColor: colors.bg2,
    borderColor: colors.line,
    borderWidth: StyleSheet.hairlineWidth,
    borderRadius: radius.lg,
    borderCurve: "continuous",
    padding: 20,
    gap: 16,
  },
  cardHead: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: 12 },
  cardHeadText: { gap: 8, flexShrink: 1 },

  btn: {
    height: 50,
    paddingHorizontal: 22,
    borderRadius: radius.pill,
    borderCurve: "continuous",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    borderWidth: 1,
    borderColor: "transparent",
  },
  btnSm: { height: 38, paddingHorizontal: 15 },
  btnJade: { backgroundColor: colors.accent },
  btnLine: { borderColor: colors.lineStrong },
  btnGhost: {},
  btnPressed: { opacity: 0.8, transform: [{ scale: 0.98 }] },
  btnOff: { opacity: 0.45 },
  btnText: { fontFamily: fonts.sansMedium, fontSize: 16, lineHeight: 20 },
  btnTextSm: { fontSize: 14 },

  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: radius.pill, alignSelf: "flex-start" },
  badgeText: { fontSize: 10, letterSpacing: 1.2 },

  notice: { borderRadius: radius.md, borderCurve: "continuous", borderWidth: 1, paddingHorizontal: 16, paddingVertical: 12 },
  noticeText: { fontSize: 14, lineHeight: 20 },

  row: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingVertical: 10 },
  rowRule: { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.line },
  rowK: { fontSize: 15 },
  rowV: { fontSize: 15, flexShrink: 1, textAlign: "right" },

  meter: { height: 6, borderRadius: 3, backgroundColor: colors.bg3, overflow: "hidden" },
  meterFill: { height: "100%", width: "100%", borderRadius: 3, transformOrigin: "left" },
});

const badgeTone = StyleSheet.create({
  ok: { backgroundColor: colors.accentSoft },
  warn: { backgroundColor: colors.warningSoft },
  bad: { backgroundColor: colors.dangerSoft },
  muted: { backgroundColor: colors.bg3 },
});
const badgeText = StyleSheet.create({
  ok: { color: colors.accent },
  warn: { color: colors.warning },
  bad: { color: colors.danger },
  muted: { color: colors.fg2 },
});
const noticeTone = StyleSheet.create({
  info: { backgroundColor: "rgba(63, 224, 174, 0.07)", borderColor: "rgba(63, 224, 174, 0.22)" },
  warn: { backgroundColor: colors.warningSoft, borderColor: "rgba(242, 180, 92, 0.3)" },
  bad: { backgroundColor: colors.dangerSoft, borderColor: "rgba(255, 122, 112, 0.3)" },
});
const noticeText = StyleSheet.create({
  info: { color: colors.jade100 },
  warn: { color: "#f6cf95" },
  bad: { color: "#ffb1aa" },
});
