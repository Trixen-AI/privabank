/**
 * Renders the CassaFi brand exports from one SVG source, so the favicon, the
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
// The website's night canvas and its bright jade, used wherever the mark sits on the brand background.
const NIGHT = "#08090a";
const JADE_BRIGHT = "#3fe0ae";
const JADE_PALE = "#c2fbe8";

// Same geometry as MARK_FRAME / MARK_NOTE in src/components/ui/Logo.tsx.
const FRAME = "M47 14H27A13 13 0 0 0 14 27V37A13 13 0 0 0 27 50H47";

/** The mark on its own, in a 64x64 box: the till frame and the note inside it. */
const mark = (frame = JADE, note = JADE_400) => `
  <path d="${FRAME}" fill="none" stroke="${frame}" stroke-width="12" stroke-linecap="round"/>
  <rect x="33" y="25" width="14" height="14" rx="4" fill="${note}"/>`;

/* ---- favicon: the mark alone ---- */
const faviconSvg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">${mark()}</svg>`;
writeFileSync(`${OUT}/favicon.svg`, faviconSvg);
// Also at the root path some browsers and crawlers request directly.
writeFileSync("public/favicon.svg", faviconSvg);

/* ---- full lockup: mark + two-colour outlined wordmark ---- */
const [, vbY, vbW, vbH] = wmBox.split(" ").map(Number);
const MARK_H = 56; // mark box; the drawn frame spans y 8..56 inside it
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
  // The drawn mark spans x 8..53, y 8..56 of its 64 box. Scale that 48-unit
  // height to the inner square and centre the mark's own bounds, not the box.
  const pad = 0.12 * 500;
  const s = (500 - pad * 2) / 48;
  const tx = 250 - 30.5 * s;
  const ty = 250 - 32 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="500" height="500" viewBox="0 0 500 500">
    ${bg ? `<rect width="500" height="500" fill="${bg}"/>` : ""}
    <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})">${
      bg ? mark(JADE_BRIGHT, JADE_PALE) : mark()
    }</g>
  </svg>`;
};

const render = (svg, file) => {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: 500 } }).render().asPng();
  writeFileSync(`${OUT}/${file}`, png);
  return png.length;
};

render(square(NIGHT), "logo-500.png");
render(square(null), "logo-500-transparent.png");

/* ---- app icons (touch icon + web manifest): same square, rendered at size ---- */
const renderAt = (svg, file, width, extra = {}) => {
  const png = new Resvg(svg, { fitTo: { mode: "width", value: width }, ...extra }).render().asPng();
  writeFileSync(`public/${file}`, png);
};
renderAt(square(NIGHT), "apple-touch-icon.png", 180);
renderAt(square(NIGHT), "icon-192.png", 192);
renderAt(square(NIGHT), "icon-512.png", 512);

/* ---- Open Graph share image, 1200x630: night panel, mark, wordmark, headline ---- */
const [, , ogVbW, ogVbH] = wmBox.split(" ").map(Number);
const ogWmH = 46;
const ogWmScale = ogWmH / ogVbH;
const og = `<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="630" viewBox="0 0 1200 630">
  <defs>
    <radialGradient id="g1" cx="50%" cy="-20%" r="90%">
      <stop offset="0" stop-color="#3fe0ae" stop-opacity="0.16"/>
      <stop offset="0.55" stop-color="#3fe0ae" stop-opacity="0"/>
    </radialGradient>
    <radialGradient id="g2" cx="50%" cy="115%" r="60%">
      <stop offset="0" stop-color="#0fae80" stop-opacity="0.35"/>
      <stop offset="0.7" stop-color="#0fae80" stop-opacity="0"/>
    </radialGradient>
    <pattern id="dots" width="24" height="24" patternUnits="userSpaceOnUse">
      <circle cx="12" cy="12" r="1.2" fill="#f1eee6" fill-opacity="0.07"/>
    </pattern>
  </defs>
  <rect width="1200" height="630" fill="${NIGHT}"/>
  <rect width="1200" height="630" fill="url(#dots)"/>
  <rect width="1200" height="630" fill="url(#g1)"/>
  <rect width="1200" height="630" fill="url(#g2)"/>
  <g transform="translate(88 78) scale(1.25)">${mark(JADE_BRIGHT, JADE_PALE)}</g>
  <g transform="translate(178 ${78 + 40 - ogWmH / 2 + 2}) scale(${ogWmScale.toFixed(5)}) translate(0 ${(-wmBox.split(" ").map(Number)[1]).toFixed(2)})">
    <path d="${wmA}" fill="#f1eee6"/>
    <path d="${wmB}" fill="${JADE_BRIGHT}"/>
  </g>
  <text x="96" y="340" font-family="General Sans" font-weight="600" font-size="92" letter-spacing="-2" fill="#f1eee6">Banking,</text>
  <text x="96" y="440" font-family="General Sans" font-weight="600" font-size="92" letter-spacing="-2" fill="${JADE_BRIGHT}">off the record.</text>
  <text x="100" y="520" font-family="General Sans" font-weight="600" font-size="30" fill="#a2aaa7">The onchain neobank that runs on permission.</text>
  <text x="1104" y="566" text-anchor="end" font-family="General Sans" font-weight="600" font-size="24" letter-spacing="1" fill="#626b69">cassafi.money</text>
</svg>`;
void ogVbW;
renderAt(og, "og-image.png", 1200, { font: { fontFiles: ["scripts/fonts/GeneralSans-600.ttf"], loadSystemFonts: false, defaultFontFamily: "General Sans" } });


/* ---- mobile app icons (mobile/assets/images), from the same mark ---- */
// The drawn mark spans x 8..53, y 8..56 of its 64 box; `fill` is how much of
// the canvas its 48-unit height takes. Android adaptive icons keep content in
// the centre 66%, so the foreground uses a smaller fill.
const mobileSquare = (size, { bg, fill, frame = JADE_BRIGHT, note = JADE_PALE }) => {
  const s = (size * fill) / 48;
  const tx = size / 2 - 30.5 * s;
  const ty = size / 2 - 32 * s;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
    ${bg ? `<rect width="${size}" height="${size}" fill="${bg}"/>` : ""}
    <g transform="translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${s.toFixed(5)})">${mark(frame, note)}</g>
  </svg>`;
};
const MOBILE = "mobile/assets/images";
mkdirSync(MOBILE, { recursive: true });
const renderMobile = (svg, file, width) => {
  writeFileSync(`${MOBILE}/${file}`, new Resvg(svg, { fitTo: { mode: "width", value: width } }).render().asPng());
};
renderMobile(mobileSquare(1024, { bg: NIGHT, fill: 0.56 }), "icon.png", 1024);
renderMobile(mobileSquare(1024, { bg: null, fill: 0.4 }), "android-icon-foreground.png", 1024);
renderMobile(`<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024"><rect width="1024" height="1024" fill="${NIGHT}"/></svg>`, "android-icon-background.png", 1024);
renderMobile(mobileSquare(1024, { bg: null, fill: 0.4, frame: "#ffffff", note: "#ffffff" }), "android-icon-monochrome.png", 1024);
renderMobile(mobileSquare(512, { bg: null, fill: 0.9 }), "splash-icon.png", 512);
renderMobile(mobileSquare(48, { bg: NIGHT, fill: 0.7 }), "favicon.png", 48);

console.log("brand exports written to", OUT, "public/ (icons, og-image) and mobile/assets/images");
