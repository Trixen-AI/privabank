/**
 * On iOS and Android the brand fonts are embedded at build time by the
 * expo-font config plugin (app.json), so they are ready at launch.
 * The web preview loads them at runtime instead: see use-brand-fonts.web.ts.
 */
export function useBrandFonts() {
  return true;
}
