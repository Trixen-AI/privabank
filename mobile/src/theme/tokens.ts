/**
 * CassaFi design tokens for the app. Same "night till" palette as the website
 * and web app (src/styles/tokens.css): ink-black canvas, bone type, one bright
 * jade signal. Keep the two files in step.
 */
export const colors = {
  bg: "#08090a",
  bg2: "#0f1112",
  bg3: "#16191a",
  fg: "#f1eee6",
  fg2: "#a2aaa7",
  fg3: "#626b69",
  line: "rgba(241, 238, 230, 0.1)",
  lineStrong: "rgba(241, 238, 230, 0.22)",
  accent: "#3fe0ae",
  accent2: "#0fae80",
  onAccent: "#032a1f",
  accentSoft: "rgba(63, 224, 174, 0.12)",
  jade100: "#c2fbe8",
  jade200: "#8bf2d0",
  bone: "#efebe1",
  fog: "#cfd9d5",
  ink: "#0b0d0d",
  warning: "#f2b45c",
  warningSoft: "rgba(242, 180, 92, 0.12)",
  danger: "#ff7a70",
  dangerSoft: "rgba(255, 122, 112, 0.12)",
} as const;

/**
 * Font families, embedded at build time by the expo-font config plugin
 * (app.json). Names are the fonts' PostScript names, which is what iOS
 * registers; the files carry the same names, which is what Android uses.
 */
export const fonts = {
  sans: "GeneralSans-Regular",
  sansMedium: "GeneralSans-Medium",
  sansSemibold: "GeneralSans-Semibold",
  serifItalic: "Newsreader-Italic",
  mono: "DMMono-Regular",
  monoMedium: "DMMono-Medium",
} as const;

export const radius = { sm: 10, md: 14, lg: 20, xl: 28, pill: 999 } as const;

/** Screen side margin, matching the website's 16px phone gutter plus a little. */
export const gutter = 20;
