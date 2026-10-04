/**
 * All Spectral copy lives here so it can be edited in one place.
 * House style: short declaratives, banking nouns, no em dashes.
 */

export const BRAND = {
  name: "Spectral",
  legal: "Spectral Protocol",
  ticker: "$SPECTRAL",
  tagline: "Privacy as infrastructure for onchain money.",
  year: 2026,
};

/* ---------------------------------------------------------------- NAV */

export type MegaLink = {
  title: string;
  desc: string;
  href: string;
  icon: string;
  soon?: boolean;
};

export const NAV = {
  product: {
    columns: [
      {
        head: "Private banking",
        variant: "vault" as const,
        links: [
          {
            title: "ZK Login",
            desc: "Sign in with Google or email. A zero-knowledge credential stands in for a private key.",
            href: "#pillars",
            icon: "fingerprint",
          },
          {
            title: "Shielded Pools",
            desc: "Deposits join one shared anonymity set. Your onchain balance reads as null.",
            href: "#network",
            icon: "layers",
          },
          {
            title: "Proof-Based Authorization",
            desc: "Spend by proving permission. Ownership of funds is never disclosed.",
            href: "#layers",
            icon: "badge-check",
          },
        ],
      },
      {
        head: "Network",
        variant: "dark" as const,
        links: [
          {
            title: "Relayer Network",
            desc: "Relayers pay the Solana fee and route transactions, so no address of yours ever touches the chain.",
            href: "#layers",
            icon: "radio-tower",
          },
          {
            title: "Merchant Settlement",
            desc: "Merchants are paid in ordinary USDC or USDT with no history attached.",
            href: "#compliance",
            icon: "store",
          },
        ],
      },
    ],
    cta: {
      title: "Roadmap",
      desc: "Four phases from core infrastructure to private payroll and treasury.",
      href: "#roadmap",
      icon: "route",
    },
  },
  resources: {
    links: [
      {
        title: "Whitepaper",
        desc: "The authorization model, the shielded pool design, and the compliance envelope.",
        href: "#papers",
        icon: "file-text",
      },
      {
        title: "Blog",
        desc: "Release notes, audits, and what we are learning about private payments.",
        href: "#papers",
        icon: "newspaper",
      },
      {
        title: "Brand",
        desc: "Logo files, colour values, and how to write about Spectral.",
        href: "#footer",
        icon: "palette",
      },
    ],
    foot: { label: "All resources", href: "#papers" },
  },
  developers: {
    links: [
      {
        title: "Quick start",
        desc: "Issue a credential, fund a shielded account, and send your first private payment.",
        href: "#build",
        icon: "terminal",
      },
      {
        title: "SDK reference",
        desc: "Credential issuance, proof construction, and relayer submission in TypeScript.",
        href: "#build",
        icon: "code",
      },
      {
        title: "GitHub",
        desc: "Circuits, Solana programs, and the relayer client, all open for review.",
        href: "#build",
        icon: "github",
      },
      {
        title: "Run a relayer",
        desc: "Process proofs, earn $SPECTRAL, and widen the anonymity set.",
        href: "#build",
        icon: "server",
        soon: true,
      },
    ],
    foot: { label: "Read the docs", href: "#build" },
  },
};

/* ---------------------------------------------------------------- HERO */

export const HERO = {
  pill: { flag: "New", text: "Spectral Protocol whitepaper", href: "#papers" },
  labelPrefix: "The authorization-based",
  labelWords: ["payments", "banking", "credentials", "settlement", "compliance", "identity"],
  labelSuffix: "network",
  h1a: "Privacy as ",
  h1b: "Infrastructure.",
  sub: "The first privacy-first, authorization-based onchain neobank. Users prove permission to spend, not ownership of funds. No public balances. No wallet addresses. Just compliant, private payments.",
  ctaPrimary: { label: "Get credentials", href: "/app/credential" },
  ctaSecondary: { label: "Buy $SPECTRAL", href: "#token" },
  // $SPECTRAL SPL token mint on Solana.
  ca: {
    label: "$SPECTRAL CA",
    chain: "Solana",
    address: "7MK1KMamq3edSkNSa9sYhzJcKBJSkDkPa6SXPK3Upump",
    explorer: "https://solscan.io/token/7MK1KMamq3edSkNSa9sYhzJcKBJSkDkPa6SXPK3Upump",
  },
  note: "Spectral replaces public wallets with Zero-Knowledge Login credentials. Authenticate without exposing your IP or your identity.",
  noteLink: { label: "Read the whitepaper", href: "#papers" },
  spec: [
    { k: "Current version", v: "v0.1.0" },
    { k: "Network", v: "Solana" },
    { k: "Status", v: "Live" },
    { k: "Powered by", v: "Spectral Protocol" },
  ],
};

export const RAILS = {
  cap: "Settles on open money rails",
};

/* ---------------------------------------------------------------- PARADIGM */

export const PARADIGM = {
  label: "The paradigm shift",
  h2a: "From glass houses to ",
  h2b: "steel vaults.",
  lead: "Most chains treat privacy as a feature you bolt on later. Spectral treats it as the floor the rest of the bank stands on.",
  cards: {
    problem: {
      title: "Transparent chains",
      body: "In the old world your balance is a public record and your history never expires. Anyone who learns one address learns your salary, your rent, and everyone you pay.",
      counter: { value: "1,284,660", caption: "public balances indexed today by open explorers" },
      chips: [
        "payroll · 2,480 USDC",
        "rent · 1,900 USDC",
        "transfer · 3.5 SOL",
        "refund · 82.40 USDT",
        "invoice #4471",
        "settlement · 640 USDC",
        "subscription · 12 USDC",
        "vendor · 3,100 USDT",
      ],
      link: "See what a public ledger reveals",
    },
    vault: {
      title: "Shielded pools",
      body: "Deposits join one shared pool and stop being individually addressable. There is no account to read, so an authorization proof takes the place of a balance.",
      link: "How the shielded pool works",
    },
    bank: {
      title: "Private neobanking",
      body: "Hold funds, spend at merchants, and receive payouts with the convenience of a bank account and the discretion of cash. Nothing about the account is legible from outside it.",
      link: "Open a Spectral account",
    },
  },
};

/* ---------------------------------------------------------------- NETWORK */

export const NETWORK = {
  liveLabel: "Live on Solana mainnet",
  h2a: "The infrastructure of ",
  h2b: "privacy.",
  desc: "A relayer network that verifies authorization proofs and settles stablecoins, running continuously across independent operators.",
  heroStat: { value: "48,317,902", label: "Authorization proofs verified" },
  stats: [
    { value: "3,912,004", label: "Private payments", sub: "+18,240 / 24h" },
    { value: "612,885", label: "Credentials issued", sub: "+1,905 / 24h" },
  ],
  epoch: { number: "118", remain: "05:12:44", filled: 7, total: 22 },
  explore: "View network explorer",
  cards: [
    { label: "Relayer node", key: "eu-west · 34ms", left: "18%", top: "58%" },
    { label: "Relayer node", key: "ap-south · 71ms", left: "70%", top: "34%" },
  ],
};

/* ---------------------------------------------------------------- PILLARS */

export const PILLARS = {
  label: "Three pillars",
  h2a: "Sovereignty without ",
  h2b: "complexity.",
  lead: "A Spectral account has no seed phrase to lose and no address to leak. Three pieces of infrastructure carry the whole experience.",
  items: [
    {
      icon: "fingerprint",
      title: "ZK Identity",
      body: "Log in with Google or email. The credential proves you are entitled to the account without revealing who you are or where you connected from.",
    },
    {
      icon: "layers",
      title: "Shielded Liquidity",
      body: "Funds sit in a shared anonymity set rather than in an account of your own. Privacy is the default state, not a mode you switch on.",
    },
    {
      icon: "wand-sparkles",
      title: "Invisible Execution",
      body: "Relayers cover the network fee and route every transaction. You authorize the payment and nothing else, so no address of yours is ever written down.",
    },
  ],
};

/* ---------------------------------------------------------------- COMPLIANCE */

export const COMPLIANCE = {
  label: "Settlement",
  h2a: "Private for you. ",
  h2b: "Compliant for them.",
  desc: "The privacy stops at the till. Merchants are paid in ordinary stablecoins they can bank, audit, and account for like any other receipt.",
  stats: [
    {
      value: "$",
      key: "Clean settlement",
      desc: "Merchants receive standard USDC or USDT with no taint and no attached history.",
    },
    {
      value: "100%",
      key: "Regulatory compliance",
      desc: "Daily limits, merchant allowlists, and signed audit reports are built into the protocol.",
    },
    {
      value: "< 2s",
      key: "Settlement time",
      desc: "Proof verification and stablecoin payout complete in under two seconds on Solana.",
    },
  ],
  cta: { label: "Set your spending controls", href: "/app/controls" },
};

/* ---------------------------------------------------------------- LAYERS */

export const LAYERS = {
  h2a: "The technology of ",
  h2b: "sound money.",
  lead: "Four layers, each doing one job, each replaceable without touching the others.",
  cta: { label: "Read the architecture", href: "#papers" },
  items: [
    {
      id: "identity",
      tab: "Identity & Auth",
      icon: "fingerprint",
      quote:
        "ZK Login issues a credential from an ordinary Google or email sign-in. The credential proves entitlement to an account without naming the holder, so there is no private key to manage and nothing to phish.",
      cite: "Identity & Auth",
      tags: ["ZK Login", "Credential issuance"],
    },
    {
      id: "liquidity",
      tab: "Privacy Liquidity",
      icon: "layers",
      quote:
        "Deposits enter a shielded pool as commitments in a UTXO set. Your onchain balance is null because there is no balance to read, only notes that a valid proof can consume.",
      cite: "Privacy Liquidity",
      tags: ["Shielded pools", "UTXO model"],
    },
    {
      id: "execution",
      tab: "Execution Layer",
      icon: "radio-tower",
      quote:
        "Relayers accept a signed proof, pay the network fee, and submit the transaction on your behalf. Fee abstraction removes the last link between a payment and an address you control.",
      cite: "Execution Layer",
      tags: ["Relayers", "Fee abstraction"],
    },
    {
      id: "settlement",
      tab: "Settlement Layer",
      icon: "banknote",
      quote:
        "Payouts leave the pool as fully backed stablecoins and settle with Solana finality. What the merchant banks is a one to one claim, indistinguishable from any other transfer.",
      cite: "Settlement Layer",
      tags: ["Stablecoins", "Onchain finality"],
    },
  ],
};

/* ---------------------------------------------------------------- PAPERS */

export const PAPERS = {
  label: "Research",
  h2: "Read the protocol",
  lead: "Everything that makes authorization-based banking work is written down, specified, and open to review before you trust a cent to it.",
  items: [
    {
      name: "Spectral",
      sub: "Authorization-Based Banking on a Shielded Pool",
      rest: "The protocol paper: credentials, notes, proofs, and settlement",
      date: "October 2026",
      variant: "jade" as const,
    },
    {
      name: "Warden",
      sub: "Compliance Without Disclosure",
      rest: "Spending limits, merchant allowlists, and audit reports under zero knowledge",
      date: "October 2026",
      variant: "dark" as const,
    },
  ],
  cta: { label: "View all research", href: "#papers" },
};

/* ---------------------------------------------------------------- TOKEN */

export const TOKEN = {
  label: "Token",
  h2a: "Powered by ",
  h2b: "$SPECTRAL.",
  lead: "$SPECTRAL pays the people who keep the anonymity set wide and the proofs verified. Real payment volume becomes real demand for the token, and the operators who carry the load are the ones who earn from it.",
  buttons: [
    { label: "$SPECTRAL token", href: "#token", icon: "coins", primary: true },
    { label: "View tokenomics", href: "#token", icon: "chart-pie", primary: false },
  ],
  tabs: [
    {
      idx: "01",
      tab: "Relayer Incentives",
      title: "Relayers earn for every proof they carry",
      body: "Operators collect $SPECTRAL fees for verifying zero-knowledge proofs and submitting transactions. The more relayers run, the wider the anonymity set gets for everyone in the pool.",
      figs: [
        { v: "1,240", k: "$SPECTRAL earned / relayer / week" },
        { v: "+12.5%", k: "Reward rate, 30d" },
      ],
    },
    {
      idx: "02",
      tab: "Governance Rights",
      title: "Holders set the rules the circuits enforce",
      body: "Verification keys, daily spending limits, and compliance policy all change by vote. Governance is the only way those parameters move, and every change is published before it takes effect.",
      figs: [
        { v: "P4", k: "Live proposal" },
        { v: "68.2%", k: "Quorum reached" },
      ],
    },
    {
      idx: "03",
      tab: "Fee Shielding",
      title: "Pay fees in $SPECTRAL at a discount",
      body: "Settling transaction fees in $SPECTRAL takes 25 percent off and decouples your stablecoin balance from network fees entirely. Your spending balance stays a spending balance.",
      figs: [
        { v: "-25%", k: "Fee discount" },
        { v: "0", k: "Stablecoin spent on fees" },
      ],
    },
    {
      idx: "04",
      tab: "Protocol Treasury",
      title: "A treasury that funds the next circuit",
      body: "A share of every fee accrues to a treasury that pays for audits, circuit work, and relayer bootstrapping. The treasury spends only where governance has voted.",
      figs: [
        { v: "18%", k: "Fee share to treasury" },
        { v: "4", k: "Audits funded" },
      ],
    },
  ],
};

/* ---------------------------------------------------------------- ROADMAP */

export const ROADMAP = {
  label: "Roadmap",
  h2a: "The path to ",
  h2b: "default privacy.",
  lead: "Four phases toward a compliant, authorization-based neobank that nobody has to configure.",
  steps: [
    {
      k: "01. Core infra",
      title: "Core Infrastructure",
      body: "ZK Login, the shielded pool, and the first relayer network running end to end on testnet.",
      done: true,
    },
    {
      k: "02. Compliance",
      title: "Compliance",
      body: "Daily spending limits, merchant allowlists, and automated audit reports for safe everyday spending.",
      done: true,
    },
    {
      k: "03. Growth",
      title: "Growth",
      body: "The $SPECTRAL launch, a permissionless relayer set, and shielded settlement beyond a single chain.",
      done: false,
    },
    {
      k: "04. Scale",
      title: "Scale",
      body: "Recurring payments, private payroll, and treasury accounts for institutions that need both discretion and an audit trail.",
      done: false,
    },
  ],
  cta: { label: "Learn more", href: "#papers" },
};

/* ---------------------------------------------------------------- CTA */

type CtaButton = { label: string; href: string; primary: boolean; soon?: boolean };
type CtaBox = {
  label: string;
  title: string;
  body: string;
  visual: "phone" | "code" | "relayer";
  buttons: CtaButton[];
};

export const CTA: {
  h2a: string;
  h2b: string;
  sub: string;
  tiles: string[];
  boxes: CtaBox[];
  features: { icon: string; text: string }[];
  phone: { label: string; amount: string };
  code: string[];
  relayer: { k: string; v: string }[];
} = {
  h2a: "Driving the next generation of ",
  h2b: "wealth.",
  sub: "Spectral is built for people who want financial privacy without giving up the things that make a bank useful. Create your credentials and start moving money quietly.",
  tiles: ["shield-check", "key-round", "fingerprint", "banknote", "lock", "receipt"],
  boxes: [
    {
      label: "Account",
      title: "Get credentials",
      body: "Sign in, receive a zero-knowledge credential, and fund a shielded balance in a couple of minutes.",
      visual: "phone",
      buttons: [{ label: "Sign up", href: "/app", primary: true }],
    },
    {
      label: "Build",
      title: "Build on Spectral",
      body: "Add private balances and proof-based payments to your own product with the TypeScript SDK.",
      visual: "code",
      buttons: [
        { label: "Quick start", href: "#build", primary: true },
        { label: "Docs", href: "#build", primary: false },
      ],
    },
    {
      label: "Network",
      title: "Run a relayer",
      body: "Verify proofs, pay Solana fees on behalf of users, and earn $SPECTRAL for widening the anonymity set.",
      visual: "relayer",
      buttons: [
        { label: "Run a relayer", href: "#build", primary: false, soon: true },
        { label: "Buy $SPECTRAL", href: "#token", primary: false },
      ],
    },
  ],
  features: [
    { icon: "shield-check", text: "Zero-knowledge architecture, proof-based by default" },
    { icon: "key-round", text: "Non-custodial: you control your funds at all times" },
    { icon: "eye-off", text: "Privacy by default, never an opt-in setting" },
    { icon: "banknote", text: "Merchants settle in standard USDC and USDT" },
    { icon: "gauge", text: "Settlement under two seconds" },
    { icon: "file-check", text: "Signed audit reports without disclosure" },
  ],
  phone: { label: "Shielded balance", amount: "$24,592.00" },
  code: [
    "const cred = await spectral.login({ provider: \"google\" });",
    "const proof = await cred.authorize({",
    "  amount: 42_00, asset: \"USDC\",",
    "  merchant: \"m_7f3a\",",
    "});",
    "await relayer.submit(proof); // < 2s",
  ],
  relayer: [
    { k: "Proofs relayed", v: "18,240 / 24h" },
    { k: "Median latency", v: "34 ms" },
    { k: "Fees earned", v: "1,240 $SPECTRAL" },
    { k: "Uptime", v: "99.98%" },
  ],
};

/* ---------------------------------------------------------------- FAQ */

export const FAQ = {
  label: "FAQ",
  h2a: "Frequently asked ",
  h2b: "questions.",
  items: [
    {
      q: "What is Spectral?",
      a: "Spectral is an onchain neobank built on authorization rather than ownership. Instead of a public wallet holding a public balance, you hold a zero-knowledge credential that proves you are allowed to spend. Funds live in a shielded pool, payments are routed by relayers, and merchants are paid in ordinary stablecoins.",
    },
    {
      q: "If there is no wallet address, how do I hold money?",
      a: "Your deposit becomes a note inside a shared shielded pool. The note is a commitment that only a valid proof can consume. Nothing in the pool is addressed to you, which is why an outside observer cannot read your balance, and why there is no address to correlate across payments.",
    },
    {
      q: "What does authorization-based mean in practice?",
      a: "When you pay, you do not present a key that says these funds are mine. You present a proof that says a rule permits this spend: the credential is valid, the note has not been consumed, and the amount sits inside your limit. The protocol verifies the proof and the payment settles.",
    },
    {
      q: "Is this compatible with regulation?",
      a: "That is the point of the design. Daily limits, merchant allowlists, and signed audit reports are enforced by the circuits themselves, so a regulator or an auditor can be given a verifiable report without anyone publishing a spending history. Merchants receive clean USDC or USDT with no history attached.",
    },
    {
      q: "Who pays the network fee?",
      a: "Relayers do. They accept your proof, cover the network fee, and submit the transaction. That is what keeps your own addresses off the chain entirely, and it is what relayers earn $SPECTRAL for.",
    },
    {
      q: "What is $SPECTRAL for?",
      a: "Three things: it pays relayers for verifying proofs, it gives holders the vote over verification keys, spending limits, and compliance policy, and it can be spent on transaction fees at a 25 percent discount so your stablecoin balance stays untouched by fees.",
    },
    {
      q: "Can I lose access if I lose my device?",
      a: "There is no seed phrase to lose. Credentials are re-issued from the same zero-knowledge login you set up originally, so recovering an account does not require you to have stored a secret and does not reveal your identity to the network.",
    },
  ],
};

/* ---------------------------------------------------------------- FOOTER */

export const FOOTER = {
  blurb:
    "A privacy-first, authorization-based onchain neobank. Prove permission to spend, keep your balance to yourself, and settle in stablecoins anyone can bank.",
  newsletter: {
    label: "Stay up to date",
    placeholder: "Enter email for updates",
    button: "Subscribe",
    success: "Thanks. You are on the list for privacy updates and release notes.",
    error: "That did not go through. Please check the address and try again.",
  },
  app: {
    label: "Get the app",
    body: "Download the Spectral app on your mobile device.",
    badge: "Coming soon",
  },
  columns: [
    {
      head: "Product",
      links: [
        { label: "Open the app", href: "/app" },
        { label: "ZK Login", href: "/app/credential" },
        { label: "Shielded Pools", href: "#network" },
        { label: "Proof-Based Authorization", href: "/app/pay" },
        { label: "Relayer Network", href: "#layers" },
        { label: "$SPECTRAL Token", href: "#token" },
      ],
    },
    {
      head: "Resources",
      links: [
        { label: "Documentation", href: "#build" },
        { label: "Whitepaper", href: "#papers" },
        { label: "Blog", href: "#papers" },
        { label: "Roadmap", href: "#roadmap" },
      ],
    },
    {
      head: "Company",
      links: [
        { label: "About Spectral", href: "#paradigm" },
        { label: "Brand assets", href: "#footer" },
        { label: "Careers", href: "#footer" },
      ],
    },
    {
      head: "Legal",
      links: [
        { label: "Terms of Service", href: "#footer" },
        { label: "Privacy Policy", href: "#footer" },
        { label: "Cookie Policy", href: "#footer" },
      ],
    },
  ],
  disclaimer:
    "Solana, USDC and Tether are trademarks of their owners and are named only to identify the network and assets Spectral settles on. Spectral is not affiliated with the Solana Foundation, Circle or Tether.",
  legal: [
    { label: "Terms of Service", href: "#footer" },
    { label: "Privacy Policy", href: "#footer" },
    { label: "Cookie Policy", href: "#footer" },
  ],
};

/** Social accounts. Add more entries here if Spectral opens other profiles. */
export const SOCIALS = [{ key: "x", label: "Spectral on X", href: "https://x.com/SpectralPay" }];
