/**
 * Renders the Spectral brand exports from one SVG source, so the favicon, the
 * site logo and the PNGs can never drift apart.
 *
 *   public/brand/logo.svg                 the outlined source (mark + wordmark)
 *   public/brand/favicon.svg              the mark alone
 *   public/brand/logo-500.png             500x500 on the brand background
 *   public/brand/logo-500-transparent.png 500x500 with alpha
 *
 * Run: node scripts/export-brand.mjs (or npm run brand, which outlines the wordmark first)
 */
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const OUT = "public/brand";
mkdirSync(OUT, { recursive: true });

const { viewBox: wmBox, a: wmA } = JSON.parse(readFileSync("scripts/wordmark.json", "utf8"));

// Same values as src/styles/tokens.css (the GhostCard-derived palette).
const INK = "#050507";
const CHALK = "#F5F3FA";
const LILAC = "#D7ADFF";
const VIOLET = "#B600FF";
const ASH = "#AAA5B5";

// Same geometry as MARK_S in src/components/ui/Logo.tsx: an S drawn as one
// round-capped band (16 wide), with a 6-wide spine running down its middle.
const S = "M46 14H25A9 9 0 0 0 25 32H39A9 9 0 0 1 39 50H18";

/**
 * The mark on its own, in a 64x64 box. On the dark brand background the band is
 * lilac with a violet spine; on light or unknown backgrounds (favicon, the
 * transparent PNG) the band is violet with a lilac spine so it keeps its contrast.
 */
const mark = (band = VIOLET, spine = LILAC) => `
  <path d="${S}" fill="none" stroke="${band}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
  <path d="${S}" fill="none" stroke="${spine}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;

/* ---- favicon: the mark alone ---- */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${mark()}</svg>`;
writeFileSync(`${OUT}/favicon.svg`, faviconSvg);
// Also at the root path some browsers and crawlers request directly.
writeFileSync("public/favicon.svg", faviconSvg);

/* ---- full lockup: mark + outlined wordmark ---- */
const [, vbY, vbW, vbH] = wmBox.split(" ").map(Number);
const MARK_H = 56;
// The wordmark box runs from cap height to the descender of "p"; size it so the
// capital S matches the mark's drawn height.
const WM_H = 34;
const scale = WM_H / vbH;
const wmW = vbW * scale;
const GAP = 10;
const totalW = MARK_H + GAP + wmW;
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(2)} ${MARK_H}" width="${totalW.toFixed(0)}" height="${MARK_H}">
  <g transform="scale(${(MARK_H / 64).toFixed(5)})">${mark()}</g>
  <g transform="translate(${(MARK_H + GAP).toFixed(2)} ${((MARK_H - WM_H) / 2 + 4).toFixed(2)}) scale(${scale.toFixed(5)}) translate(0 ${(-vbY).toFixed(2)})">
    <path d="${wmA}" fill="${INK}"/>
  </g>
</svg>`;
writeFileSync(`${OUT}/logo.svg`, logo);

/* ---- 500x500 PNGs: mark centred with ~12% padding ---- */
// The drawn mark spans x 10..54, y 6..58 of its 64 box (band + round caps).
const square = (bg, size = 500) => {
  const pad = 0.12 * size;
  const s = (size - pad * 2) / 52;
  const tx = size / 2 - 32 * s;
  const ty = size / 2 - 32 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ""}
    <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})">${bg ? mark(LILAC, VIOLET) : mark()}</g>
  </svg>`;
};

const render = (svg, file) => {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 500 } }).render().asPng();
  writeFileSync(`${OUT}/${file}`, png);
};

render(square(INK), "logo-500.png");
render(square(null), "logo-500-transparent.png");

/* ---- app icons (touch icon + web manifest) ---- */
const renderAt = (svg, file, width, extra = {}) => {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, ...extra }).render().asPng();
  writeFileSync(`public/${file}`, png);
};
renderAt(square(INK), "apple-touch-icon.png", 180);
renderAt(square(INK), "icon-192.png", 192);
renderAt(square(INK), "icon-512.png", 512);

/* ---- Open Graph share image, 1200x630: ink panel, mark, wordmark, headline ---- */
const ogWmH = 52;
const ogWmScale = ogWmH / vbH;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <rect width="1200" height="630" fill="${INK}"/>
  <rect x="0" y="0" width="1200" height="1" fill="#29262F"/>
  <rect x="96" y="250" width="44" height="3" fill="${VIOLET}"/>
  <g transform="translate(88 70) scale(1.25)">${mark(LILAC, VIOLET)}</g>
  <g transform="translate(180 ${70 + 40 - 22}) scale(${ogWmScale.toFixed(5)}) translate(0 ${(-vbY).toFixed(2)})">
    <path d="${wmA}" fill="${CHALK}"/>
  </g>
  <text x="96" y="350" font-family="General Sans" font-weight="600" font-size="88" letter-spacing="-2" fill="${CHALK}">Privacy as</text>
  <text x="96" y="446" font-family="General Sans" font-weight="600" font-size="88" letter-spacing="-2" fill="${LILAC}">Infrastructure.</text>
  <text x="100" y="522" font-family="General Sans" font-weight="600" font-size="28" fill="${ASH}">The authorization-based onchain neobank.</text>
  <text x="1104" y="572" text-anchor="end" font-family="General Sans" font-weight="600" font-size="22" letter-spacing="1" fill="${ASH}">spectral.money</text>
</svg>`;
renderAt(og, "og-image.png", 1200, {
  font: { fontFiles: ["scripts/fonts/GeneralSans-600.ttf"], loadSystemFonts: false, defaultFontFamily: "General Sans" },
});

console.log("brand exports written to", OUT, "and public/ (icons, og-image)");
