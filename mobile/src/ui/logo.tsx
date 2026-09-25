import { View } from "react-native";
import Svg, { Path, Rect } from "react-native-svg";
import { colors } from "@/theme/tokens";
import { WORDMARK_PATH_A, WORDMARK_PATH_B, WORDMARK_VIEWBOX } from "./generated/wordmark";

/*
 * The CassaFi mark: a till drawn as a C, with one plain note held inside.
 * Same geometry as src/components/ui/Logo.tsx on the website.
 */
const MARK_FRAME = "M47 14H27A13 13 0 0 0 14 27V37A13 13 0 0 0 27 50H47";

export function Logomark({ size = 28, frame = colors.accent, note = colors.jade100 }: { size?: number; frame?: string; note?: string }) {
  return (
    // Decorative: hidden from screen readers; the wordmark next to it carries the name.
    <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <Svg width={size} height={size} viewBox="0 0 64 64">
        <Path d={MARK_FRAME} stroke={frame} strokeWidth={12} strokeLinecap="round" fill="none" />
        <Rect x={33} y={25} width={14} height={14} rx={4} fill={note} />
      </Svg>
    </View>
  );
}

const [, , VB_W, VB_H] = WORDMARK_VIEWBOX.split(" ").map(Number);

export function Wordmark({ height = 18, a = colors.fg, b = colors.accent }: { height?: number; a?: string; b?: string }) {
  return (
    <Svg height={height} width={(height * VB_W) / VB_H} viewBox={WORDMARK_VIEWBOX} accessibilityLabel="CassaFi">
      <Path d={WORDMARK_PATH_A} fill={a} />
      <Path d={WORDMARK_PATH_B} fill={b} />
    </Svg>
  );
}
