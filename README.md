# CassaFi

The website (https://cassafi.money) and product dashboard for CassaFi, the onchain neobank that runs on permission. Built with React 19, Vite, TypeScript and React Router, using plain CSS. The dashboard lives at `/app` and connects wallets through Reown AppKit.

## Setup

Copy `.env.example` to `.env` and set `VITE_REOWN_PROJECT_ID` (free at https://dashboard.reown.com; add your origin, e.g. `http://localhost:5173`, to the project's allowed domains). Without it, `/app` shows a setup screen instead of the wallet modal.

## Run

```bash
npm install
npm run dev      # local dev server
npm run build    # type-check and production build
npm run lint
npm run brand    # regenerate the wordmark paths and the files in public/brand/
```

## Where things live

| What | File |
|---|---|
| All page copy | `src/data/site.ts` |
| Design tokens: one night palette for site and app (colours, type scale, spacing, motion) | `src/styles/tokens.css` |
| Website sections, hero deck, pinned $CASSA stage | `src/site/` |
| Website styles (mirrors the tokens as `--pv-*`) | `src/site/site.css` |
| App chrome (capsule nav, menu, rail) and connect screen | `src/dashboard/layout/` |
| Logo mark and wordmark | `src/components/ui/Logo.tsx`, `src/components/ui/wordmark.ts` |
| Illustrations for the "Why CassaFi" tiles | `src/site/Art.tsx` |
| Brand exports | `public/brand/` (`logo.svg`, `favicon.svg`, `logo-500.png`, `logo-500-transparent.png`) |

## Dashboard (`/app`)

| Page | What it does, with live data |
|---|---|
| Overview | Wallet balance, credential status, today's limits, exposure score, live network vitals, recent activity |
| Authorize payment | Policy checks, EIP-712 authorization signed with the credential, settlement via relayer or wallet, receipt tracking |
| Activity | Merged on-chain history (explorer, or RPC logs where the explorer blocks browsers), authorizations, CSV export |
| Credential | Issue a credential from one EIP-712 signature (verified on-chain, EOA or ERC-1271), re-verify, revoke |
| Exposure report | What the public ledger reveals about the address: balance, nonce, counterparties, ENS, token footprint |
| Spending controls | Daily limits per asset, merchant allowlist, signed audit reports and a verifier |
| Settings | Account, network switching, relayer status, backup / restore / clear of on-device data |

Networks: Robinhood Chain (4663) and Ethereum (1). Credentials, limits, allowlists, authorizations and reports are stored per address in the browser (`localStorage`, versioned); only public values are kept, never signatures used as secrets.

Protocol pieces that need infrastructure: payments settle **from the user's wallet** (public, user pays gas) until `VITE_RELAYER_URL` points at a relayer implementing `GET /health` and `POST /v1/authorizations`. There is no shielded-pool contract yet, so balances shown are the wallet's public balances.

## Before going live

- **Social links.** The footer links to X only, at https://x.com/CassaFi (`SOCIALS` in `src/data/site.ts`).
- **X icon.** The official X logo from X's brand toolkit (https://about.x.com/content/dam/about-twitter/x/brand-toolkit/x-logo.zip), stored unmodified in `src/assets/social/x.svg` and inlined in `src/site/Footer.tsx`.
- **Newsletter.** The footer form only validates the address and shows a message. It is not connected to a mailing list provider yet.
- **Figures.** Network stats, counters, token figures and relayer numbers are illustrative placeholders, not live data.
- **Links.** Info links point to anchors on the landing page; product actions (Log in, Sign up, Get credentials, Buy $CASSA) open the dashboard.
- **Hosting.** Deployed on Vercel at https://cassafi.money. `vercel.json` rewrites unknown paths to `index.html` so `/app/*` routes survive a refresh; `robots.txt` keeps `/app` out of search.
- **Android download.** The APK is served by the site itself from `public/downloads/CassaFi.apk`; `vercel.json` sends it as a download named `CassaFi.apk`, and `https://cassafi.money/download/android` redirects to it.

## Deploy on Vercel

1. In Vercel, import the GitHub repository. The framework (Vite), build command, output folder and SPA rewrites come from `vercel.json`; `.vercelignore` keeps the `mobile/` app out of the website build.
2. Add the environment variables under **Settings → Environment Variables** (Production and Preview):

   | Variable | Required | Value |
   |---|---|---|
   | `VITE_REOWN_PROJECT_ID` | Yes | Your Reown project ID (the same one in `.env`) |
   | `VITE_RELAYER_URL` | No | Relayer base URL, once one is live |
   | `VITE_CASSA_TOKEN_ADDRESS` | No | $CASSA contract address, once deployed |
   | `VITE_CASSA_TOKEN_CHAIN_ID` | No | Chain of that contract (default `4663`) |

   `VITE_` variables are built into the site, so redeploy after changing one.
3. Under **Settings → Domains**, add `cassafi.money` and `www.cassafi.money`, then set the DNS records Vercel shows at your registrar (an `A` record for the apex and a `CNAME` for `www`). `vercel.json` sends `www` to the apex.
4. In the Reown dashboard, add `https://cassafi.money` (and your `*.vercel.app` preview URL if you test there) to the project's allowed domains, plus `money.cassafi.app` for the Android app.

## Publishing a new Android build

1. Build the website APK (64-bit ARM only, which keeps it small enough to host here): `cd mobile && eas build --platform android --profile website`.
2. Download the APK from the build page and save it as `public/downloads/CassaFi.apk`, replacing the old one.
3. Update the version and size in `FOOTER.app.android.meta` (`src/data/site.ts`) and `fileSize` / `softwareVersion` in `index.html`, then commit and push. Vercel deploys it.

## Third-party marks

USDC and Tether logos are the official files from each brand's own kit. The Robinhood logo comes from Wikimedia Commons, because robinhood.com's press kit could not be reached; replace it with the press-kit file if you have it. All are used unmodified, only to name what CassaFi settles on. CassaFi is not affiliated with Robinhood, Circle or Tether. Sources:

- Robinhood: https://commons.wikimedia.org/wiki/File:Robinhood_logo.svg
- USDC: https://www.circle.com/pressroom (brand kit, `Lockup/USDC Lockup.svg`)
- Tether: https://tether.to/en/media/ (`/images/logoGreen.svg`)

The CassaFi card shows the Visa, Mastercard or Discover mark for its number's network. The brand portals (brand.visa.com, mastercard.com/brandcenter) require sign-in or block automated download, so these are the Wikimedia Commons copies of the current official artwork, stored unmodified in `src/assets/networks/`; on the dark card CSS applies each brand's reversed (white) variant. Replace them with the brand-kit files when you have access. Sources are listed in `src/dashboard/ui/BankCard.tsx`.
