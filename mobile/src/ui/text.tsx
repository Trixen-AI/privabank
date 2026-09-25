import { StyleSheet, Text as RNText, type TextProps as RNTextProps } from "react-native";
import { colors, fonts } from "@/theme/tokens";

/**
 * The app's type system, the website's in miniature: General Sans for words,
 * DM Mono for machine labels and figures, Newsreader italic for the one phrase
 * in a headline that matters. Hierarchy comes mostly from weight and colour;
 * sizes are kept to a short list.
 */
type Variant = "body" | "muted" | "faint" | "strong" | "title" | "display" | "label" | "mono" | "figure";

export type TextProps = RNTextProps & { variant?: Variant; tone?: "accent" | "danger" | "warning" | "onAccent" };

export function Text({ variant = "body", tone, style, ...rest }: TextProps) {
  return <RNText {...rest} style={[styles.base, styles[variant], tone ? tones[tone] : null, style]} />;
}

/** The italic serif phrase inside a headline, in jade. Nest it inside a title or display Text. */
export function Em({ children }: { children: React.ReactNode }) {
  return <RNText style={styles.em}>{children}</RNText>;
}

const styles = StyleSheet.create({
  base: { color: colors.fg, fontFamily: fonts.sans, fontSize: 16, lineHeight: 23 },
  body: {},
  muted: { color: colors.fg2 },
  faint: { color: colors.fg3, fontSize: 14, lineHeight: 20 },
  strong: { fontFamily: fonts.sansMedium },
  title: { fontFamily: fonts.sansMedium, fontSize: 21, lineHeight: 26, letterSpacing: -0.4 },
  display: { fontFamily: fonts.sansMedium, fontSize: 40, lineHeight: 44, letterSpacing: -1.4 },
  label: { fontFamily: fonts.mono, fontSize: 11, lineHeight: 14, letterSpacing: 1.8, textTransform: "uppercase", color: colors.fg2 },
  mono: { fontFamily: fonts.mono, fontSize: 14, lineHeight: 20 },
  figure: { fontFamily: fonts.sansMedium, fontSize: 48, lineHeight: 52, letterSpacing: -2, fontVariant: ["tabular-nums"] },
  em: { fontFamily: fonts.serifItalic, color: colors.accent, letterSpacing: -0.4 },
});

const tones = StyleSheet.create({
  accent: { color: colors.accent },
  danger: { color: colors.danger },
  warning: { color: colors.warning },
  onAccent: { color: colors.onAccent },
});
