# PrivaBank

The website and product dashboard for PrivaBank, a privacy-first, authorization-based onchain neobank. Built with React 19, Vite, TypeScript and React Router, using plain CSS. The dashboard lives at `/app` and connects wallets through Reown AppKit.

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
| Authorize payment | Policy checks, EIP-712 authorization signed with the credential, settlement via relayer or wallet, receipt tracking |
| Activity | Merged on-chain history (explorer, or RPC logs where the explorer blocks browsers), authorizations, CSV export |
| Credential | Issue a credential from one EIP-712 signature (verified on-chain, EOA or ERC-1271), re-verify, revoke |
| Exposure report | What the public ledger reveals about the address: balance, nonce, counterparties, ENS, token footprint |
| Spending controls | Daily limits per asset, merchant allowlist, signed audit reports and a verifier |
| $PRIVA | Balance, supply and fee-shielding status once `VITE_PRIVA_TOKEN_ADDRESS` is set |
| Settings | Account, network switching, relayer status, backup / restore / clear of on-device data |

Networks: Robinhood Chain (4663), Ethereum (1), Robinhood Chain Testnet (46630), Sepolia. Credentials, limits, allowlists, authorizations and reports are stored per address in the browser (`localStorage`, versioned); only public values are kept, never signatures used as secrets.

Protocol pieces that need infrastructure: payments settle **from the user's wallet** (public, user pays gas) until `VITE_RELAYER_URL` points at a relayer implementing `GET /health` and `POST /v1/authorizations`. There is no shielded-pool contract yet, so balances shown are the wallet's public balances.

## Before going live

- **Social links.** The footer links to X only, at https://x.com/PrivaBank (`SOCIALS` in `src/data/site.ts`).
- **X icon.** X's brand toolkit is gated, so the X link uses a neutral placeholder mark. Drop the official SVG into `src/assets/social/` and inline it in `Footer.tsx`.
- **Newsletter.** The footer form only validates the address and shows a message. It is not connected to a mailing list provider yet.
- **Figures.** Network stats, counters, token figures and relayer numbers are illustrative placeholders, not live data.
- **Links.** Info links point to anchors on the landing page; product actions (Log in, Sign up, Get credentials, Buy $PRIVA) open the dashboard.
- **Hosting.** Deployed on Vercel at https://privabank.money. `vercel.json` rewrites unknown paths to `index.html` so `/app/*` routes survive a refresh; `robots.txt` keeps `/app` out of search.

## Third-party marks

USDC and Tether logos are the official files from each brand's own kit. The Robinhood logo comes from Wikimedia Commons, because robinhood.com's press kit could not be reached; replace it with the press-kit file if you have it. All are used unmodified, only to name what PrivaBank settles on. PrivaBank is not affiliated with Robinhood, Circle or Tether. Source URLs are recorded in `src/components/sections/Hero.tsx`.

The PrivaBank card shows the Visa, Mastercard or Discover mark for its number's network. The brand portals (brand.visa.com, mastercard.com/brandcenter) require sign-in or block automated download, so these are the Wikimedia Commons copies of the current official artwork, stored unmodified in `src/assets/networks/`; on the dark card CSS applies each brand's reversed (white) variant. Replace them with the brand-kit files when you have access. Sources are listed in `src/dashboard/ui/BankCard.tsx`.
