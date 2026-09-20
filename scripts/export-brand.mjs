/**
 * Renders the PrivaBank brand exports from one SVG source, so the favicon, the
 * site logo and the PNGs can never drift apart.
 *
 *   public/brand/logo.svg                 the outlined source (mark + wordmark)
 *   public/brand/favicon.svg              the mark alone
 *   public/brand/logo-500.png             500x500 on the brand background
 *   public/brand/logo-500-transparent.png 500x500 with alpha
 *
 * Run: node scripts/export-brand.mjs
 */
import { Resvg } from "@resvg/resvg-js";
import { mkdirSync, writeFileSync, readFileSync } from "node:fs";

const OUT = "public/brand";
mkdirSync(OUT, { recursive: true });

const { viewBox: wmBox, a: wmA, b: wmB } = JSON.parse(readFileSync("scripts/wordmark.json", "utf8"));

const JADE = "#0b8a66";
const JADE_400 = "#20cd99";
const INK = "#07090a";

// Same geometry as MARK_P / MARK_KEYHOLE / MARK_CHIP in src/components/ui/Logo.tsx.
const P = "M19 10H36A14 14 0 0 1 36 38H26V49A5 5 0 0 1 21 54H19A5 5 0 0 1 14 49V15A5 5 0 0 1 19 10Z";
const KEYHOLE = "M40.1 25.59A4.6 4.6 0 1 0 35.9 25.59L36.5 32.5H39.5Z";

/** The mark on its own, in a 64x64 box. */
const mark = (body = JADE, chip = JADE_400) => `
  <path d="${P} ${KEYHOLE}" fill-rule="evenodd" clip-rule="evenodd" fill="${body}"/>
  <rect x="34" y="43" width="14" height="11" rx="3.5" fill="${chip}"/>`;

/* ---- favicon: the mark alone ---- */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${mark()}</svg>`;
writeFileSync(`${OUT}/favicon.svg`, faviconSvg);
// Also at the root path some browsers and crawlers request directly.
writeFileSync("public/favicon.svg", faviconSvg);

/* ---- full lockup: mark + two-colour outlined wordmark ---- */
const [, vbY, vbW, vbH] = wmBox.split(" ").map(Number);
const MARK_H = 56; // mark box; the drawn glyph spans y 10..54 inside it
const WM_H = 30;
const scale = WM_H / vbH;
const wmW = vbW * scale;
const GAP = 10;
const totalW = MARK_H + GAP + wmW;
const logo = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${totalW.toFixed(2)} ${MARK_H}" width="${totalW.toFixed(0)}" height="${MARK_H}">
  <g transform="scale(${(MARK_H / 64).toFixed(5)})">${mark()}</g>
  <g transform="translate(${(MARK_H + GAP).toFixed(2)} ${((MARK_H - WM_H) / 2).toFixed(2)}) scale(${scale.toFixed(5)}) translate(0 ${(-vbY).toFixed(2)})">
    <path d="${wmA}" fill="${INK}"/>
    <path d="${wmB}" fill="${JADE}"/>
  </g>
</svg>`;
writeFileSync(`${OUT}/logo.svg`, logo);

/* ---- 500x500 PNGs: mark centred with ~12% padding ---- */
const square = (bg) => {
  const pad = 0.12 * 500;
  const inner = 500 - pad * 2;
  const s = inner / 64;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    ${bg ? `<rect width="500" height="500" fill="${bg}"/>` : ""}
    <g transform="translate(${pad} ${pad}) scale(${s.toFixed(5)})">${
      bg ? mark("#ffffff", "#8bf2d0") : mark()
    }</g>
  </svg>`;
};

const render = (svg, file) => {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 500 } }).render().asPng();
  writeFileSync(`${OUT}/${file}`, png);
  return png.length;
};

render(square(JADE), "logo-500.png");
render(square(null), "logo-500-transparent.png");

/* ---- app icons (touch icon + web manifest): same square, rendered at size ---- */
const renderAt = (svg, file, width, extra = {}) => {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, ...extra }).render().asPng();
  writeFileSync(`public/${file}`, png);
};
renderAt(square(JADE), "apple-touch-icon.png", 180);
renderAt(square(JADE), "icon-192.png", 192);
renderAt(square(JADE), "icon-512.png", 512);

/* ---- Open Graph share image, 1200x630: jade panel, mark, wordmark, headline ---- */
const [, , ogVbW, ogVbH] = wmBox.split(" ").map(Number);
const ogWmH = 46;
const ogWmScale = ogWmH / ogVbH;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g1" cx="50%" cy="-20%" r="90%">
      <stop offset="0" stop-color="#ffffff" stop-opacity="0.26"/>
      <stop offset="0.55" stop-color="#ffffff" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="50%" cy="115%" r="60%">
      <stop offset="0" stop-color="#c2fbe8" stop-opacity="0.55"/>
      <stop offset="0.7" stop-color="#c2fbe8" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.4" fill="#ffffff" fill-opacity="0.12"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${JADE}"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <g transform="translate(88 78) scale(1.25)">${mark("#ffffff", "#8bf2d0")}</g>
  <g transform="translate(178 ${78 + 40 - ogWmH / 2 + 2}) scale(${ogWmScale.toFixed(5)}) translate(0 ${(-wmBox.split(" ").map(Number)[1]).toFixed(2)})">
    <path d="${wmA}" fill="#ffffff"/>
    <path d="${wmB}" fill="#c2fbe8"/>
  </g>
  <text x="96" y="340" font-family="General Sans" font-weight="600" font-size="92" letter-spacing="-2" fill="#ffffff">Privacy as</text>
  <text x="96" y="440" font-family="General Sans" font-weight="600" font-size="92" letter-spacing="-2" fill="#c2fbe8">Infrastructure.</text>
  <text x="100" y="520" font-family="General Sans" font-weight="600" font-size="30" fill="#ffffff" fill-opacity="0.82">The authorization-based onchain neobank.</text>
  <text x="1104" y="566" text-anchor="end" font-family="General Sans" font-weight="600" font-size="24" letter-spacing="1" fill="#ffffff" fill-opacity="0.7">privahub.money</text>
</svg>`;
void ogVbW;
renderAt(og, "og-image.png", 1200, { font: { fontFiles: ["scripts/fonts/GeneralSans-600.ttf"], loadSystemFonts: false, defaultFontFamily: "General Sans" } });

console.log("brand exports written to", OUT, "and public/ (icons, og-image)");
