# Spectral

The website and product dashboard for Spectral, a privacy-first, authorization-based onchain neobank on Solana. Built with React 19, Vite, TypeScript and React Router, using plain CSS. The dashboard lives at `/app` and connects Solana wallets (Phantom, Solflare, Backpack, WalletConnect, email and social login) through Reown AppKit with the Solana adapter.

## Setup

Copy `.env.example` to `.env` and fill it in. Without `VITE_REOWN_PROJECT_ID`, `/app` shows a setup screen instead of the wallet modal.

| Variable | Needed | What it is |
|---|---|---|
| `VITE_REOWN_PROJECT_ID` | **Required** | Project ID from https://dashboard.reown.com. Add every origin that serves the app (`http://localhost:5173`, `https://spectral.money`, your `*.vercel.app` URL) to the project's allowed domains. |
| `VITE_SOLANA_RPC_URL` | Recommended | A Solana mainnet RPC that accepts browser requests (Helius, QuickNode, Triton, Alchemy). When empty the app uses Reown's shared Solana RPC, which is rate limited and slow for large wallets. `api.mainnet-beta.solana.com` refuses browser requests, so it can't be used. |
| `VITE_RELAYER_URL` | Optional | Relayer base URL (`GET /health`, `POST /v1/authorizations`). Leave empty until a relayer is live. |
| `VITE_SPECTRAL_TOKEN_MINT` | Optional | The $SPECTRAL SPL token mint address, once it exists. |

All four are `VITE_` variables, so they are compiled into the public bundle. Never put a secret there; use an RPC key that is restricted to your domains.

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
| Design tokens (colours, type scale, spacing, motion) | `src/styles/tokens.css` |
| Logo mark and wordmark | `src/components/ui/Logo.tsx`, `src/components/ui/wordmark.ts` |
| Illustrations (paper covers, phone mock, neobank card) | `src/components/ui/Art.tsx` |
| Canvas scenes (shielded pool, settlement sweep, token dot matrix) | `src/components/viz/Scenes.tsx` |
| Relayer globe (three.js) | `src/components/viz/Globe.tsx` |
| Brand exports | `public/brand/` (`logo.svg`, `favicon.svg`, `logo-500.png`, `logo-500-transparent.png`) |

## Dashboard (`/app`)

| Page | What it does, with live data |
|---|---|
| Overview | Wallet balance, credential status, today's limits, exposure score, live network vitals, recent activity |
| Authorize payment | Policy checks, `.sol` names, an authorization signed with the wallet (Solana `signMessage`), fee estimate, settlement via relayer or a SOL / SPL transfer from the wallet, confirmation tracking |
| Activity | Solana transaction history read over RPC (SOL and SPL transfers, program calls) merged with authorizations, Solscan links, CSV export |
| Credential | Issue a credential from one ed25519 message signature (verified in the browser), re-verify, revoke |
| Exposure report | What the public ledger reveals about the address: balance, transaction count, counterparties, `.sol` name, token footprint |
| Spending controls | Daily limits per asset, merchant allowlist, signed audit reports and a verifier |
| Settings | Account, network, relayer status, backup / restore / clear of on-device data |

Network: Solana mainnet. Token names, logos and prices come from Jupiter's public token and price APIs, `.sol` names from SNS, explorer links go to Solscan. Credentials, limits, allowlists, authorizations and reports are stored per address in the browser (`localStorage`, versioned); only public values are kept, never signatures used as secrets.

Protocol pieces that need infrastructure: payments settle **from the user's wallet** (public, user pays the network fee) until `VITE_RELAYER_URL` points at a relayer implementing `GET /health` and `POST /v1/authorizations`. There is no shielded-pool program yet, so balances shown are the wallet's public balances.

## Before going live

- **Social links.** The footer links to X only, at https://x.com/SpectralPay (`SOCIALS` in `src/data/site.ts`).
- **Newsletter.** The footer form only validates the address and shows a message. It is not connected to a mailing list provider yet.
- **Figures.** Network stats, counters, token figures and relayer numbers are illustrative placeholders, not live data.
- **Links.** Info links point to anchors on the landing page; product actions (Log in, Sign up, Get credentials, Buy $SPECTRAL) open the dashboard.
- **Hosting.** Deployed on Vercel at https://spectral.money. `vercel.json` rewrites unknown paths to `index.html` so `/app/*` routes survive a refresh; `robots.txt` and an `X-Robots-Tag` header keep `/app` out of search.

## Deploy on Vercel

1. Import the GitHub repo in Vercel. The framework (Vite), install (`npm ci`), build (`npm run build`) and output (`dist`) commands come from `vercel.json`; Node 22 comes from `engines` in `package.json`.
2. In **Settings, Environment Variables**, add `VITE_REOWN_PROJECT_ID` (and `VITE_SOLANA_RPC_URL` for production) for Production and Preview, then redeploy. Vite reads them at build time, so a change needs a new deployment.
3. In **Settings, Domains**, add `spectral.money` and `www.spectral.money` and choose which one is primary there. The www / apex redirect is set only in the dashboard, not in `vercel.json`.
4. In the Reown dashboard, add `https://spectral.money`, `https://www.spectral.money` and the `*.vercel.app` URL to the allowed domains.

## Third-party marks

The Solana, USDC and Tether logos are the official files from each brand's own kit (https://solana.com/branding, Circle's press room, Tether's media page), used unmodified, only to name the network and the assets Spectral settles on. Spectral is not affiliated with the Solana Foundation, Circle or Tether. Source URLs are recorded in `src/components/sections/Hero.tsx`.

The Spectral card shows the Visa, Mastercard or Discover mark for its number's network. The brand portals (brand.visa.com, mastercard.com/brandcenter) require sign-in or block automated download, so these are the Wikimedia Commons copies of the current official artwork, stored unmodified in `src/assets/networks/`; on the dark card CSS applies each brand's reversed (white) variant. Replace them with the brand-kit files when you have access. Sources are listed in `src/dashboard/ui/BankCard.tsx`.
