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
const LILAC_TOP = "#D8A6FF";

// Same geometry as MARK_SHIELD / MARK_S / MARK_VIEWBOX in src/components/ui/Logo.tsx,
// rebuilt from the supplied artwork public/brand/logo-new.jpeg (1024 grid).
const SHIELD =
  "M505 266.5Q512 264 519 266.5L702 329Q718 335 718 352V490C718 604 634 694 522 755Q512 760 502 755C390 694 306 604 306 490V352Q306 335 322 329Z";
const S = "M591 394.5H476.75A52.75 52.75 0 0 0 476.75 500H546.75A52.25 52.25 0 0 1 546.75 604.5H432";

/** The mark in its own 1024 grid; wrap it in a viewBox of "256 256 512 512" to crop to the mark. */
const markBody = (gid) => `
  <defs><linearGradient id="${gid}" x1="0" y1="264" x2="0" y2="760" gradientUnits="userSpaceOnUse">
    <stop offset="0" stop-color="${LILAC_TOP}"/><stop offset="1" stop-color="${VIOLET}"/>
  </linearGradient></defs>
  <path d="${SHIELD}" fill="url(#${gid})"/>
  <path d="${S}" fill="none" stroke="${INK}" stroke-width="48" stroke-linecap="round" stroke-linejoin="round"/>`;

/** The mark scaled into a 64x64 box (for the lockup and the OG image). */
const mark = (gid = "m") => `<g transform="scale(0.125) translate(-256 -256)">${markBody(gid)}</g>`;

/* ---- favicon: the mark alone ---- */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="256 256 512 512">${markBody("f")}</svg>`;
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
  <g transform="scale(${(MARK_H / 64).toFixed(5)})">${mark("l")}</g>
  <g transform="translate(${(MARK_H + GAP).toFixed(2)} ${((MARK_H - WM_H) / 2 + 4).toFixed(2)}) scale(${scale.toFixed(5)}) translate(0 ${(-vbY).toFixed(2)})">
    <path d="${wmA}" fill="${INK}"/>
  </g>
</svg>`;
writeFileSync(`${OUT}/logo.svg`, logo);

/* ---- 500x500 PNGs: mark centred with ~12% padding ---- */
// The shield spans x 306..718, y 264..760 of the 1024 grid; centre it and fit
// its 496-unit height into the inner 76% of the square.
const square = (bg, size = 500) => {
  const s = (size * 0.76) / 496;
  const tx = size / 2 - 512 * s;
  const ty = size / 2 - 512 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ""}
    <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})">${markBody("q")}</g>
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
  <g transform="translate(88 70) scale(1.25)">${mark("o")}</g>
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
