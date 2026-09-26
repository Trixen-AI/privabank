/**
 * All CassaFi website copy lives here so it can be edited in one place.
 * House voice: plain money-desk English, short sentences, "you" not "users",
 * no em dashes. "Cassa" is the till: the copy leans on counters, tills,
 * receipts and records rather than on vaults and walls.
 */

export const BRAND = {
  name: "CassaFi",
  legal: "CassaFi Labs",
  ticker: "$CASSA",
  domain: "cassafi.money",
  tagline: "Banking, off the record.",
  year: 2026,
};

/* ---------------------------------------------------------------- NAV */

export const SITE_NAV = [
  { label: "Why CassaFi", href: "#paradigm" },
  { label: "How it works", href: "#layers" },
  { label: "Settlement", href: "#settlement" },
  { label: "$CASSA", href: "#token" },
  { label: "Roadmap", href: "#roadmap" },
  { label: "FAQ", href: "#faq" },
];

/** Section names for the left-margin "you are here" rail, in page order. */
export const SITE_SECTIONS = [
  { id: "top", label: "Off the record" },
  { id: "paradigm", label: "Why CassaFi" },
  { id: "layers", label: "How it works" },
  { id: "settlement", label: "Settlement" },
  { id: "token", label: "$CASSA" },
  { id: "roadmap", label: "Roadmap" },
  { id: "faq", label: "Questions" },
  { id: "footer", label: "Open an account" },
];

/* ---------------------------------------------------------------- HERO */

export const HERO = {
  pill: { flag: "Live", text: "Private payments on Robinhood Chain", href: "#layers" },
  h1a: "Banking,",
  h1b: "off the record.",
  sub: "CassaFi is an onchain neobank that runs on permission. You prove you're allowed to spend, never what you own, so there's no balance to look up and no address to follow. Merchants still get paid in clean stablecoins.",
  ctaPrimary: { label: "Get your credential", href: "/app/credential" },
  ctaSecondary: { label: "Buy $CASSA", href: "#token" },
  spec: [
    { k: "Version", v: "v0.1.0" },
    { k: "Network", v: "Ethereum / Robinhood Chain" },
    { k: "Status", v: "Live" },
    { k: "Runs on", v: "Cassa Protocol" },
  ],
};

export const HERO_DECK = {
  hint: "Tap a card to shuffle",
  card: { holder: "CASSA MEMBER", last4: "2208", expiry: "11/30" },
  credential: {
    label: "Credential",
    status: "Verified",
    bigA: "Allowed to spend.",
    bigB: "Nothing else shown.",
    id: "0x9c41…a7d2",
    rule: "Up to 500 USDC a day",
  },
  balance: { label: "Shielded balance", amount: "$24,592.00", publicLabel: "Onchain balance", publicValue: "null" },
};

export const RAILS = {
  cap: "Pays out on open rails",
};

/* ---------------------------------------------------------------- WHY (paradigm) */

export const PARADIGM = {
  label: "Why CassaFi",
  h2a: "Your balance is ",
  h2b: "nobody's business.",
  lead: "Public chains turned every payment into a permanent public record. CassaFi starts from the other end: the ledger proves a payment was allowed and says nothing else.",
  tiles: [
    {
      tag: "Before",
      title: "The open ledger",
      body: "Share one address and you share everything behind it: what you earn, what you owe, and everyone you've ever paid. That record never expires.",
    },
    {
      tag: "The pool",
      title: "One shared pool",
      body: "Deposits go into a common shielded pool and stop belonging to any visible account. A proof of permission moves the money, not a balance someone can read.",
    },
    {
      tag: "The account",
      title: "A bank account, minus the audience",
      body: "Get paid, save and spend the way you would with any bank card. The one difference is who can watch, and the answer is nobody outside the account.",
    },
  ],
};

export const PILLARS = {
  label: "Three ideas",
  h2a: "Private by default, ",
  h2b: "plain to use.",
  items: [
    {
      title: "ZK Identity",
      body: "Sign in with Google or email. A zero-knowledge credential confirms the account is yours without saying who you are or where you signed in from, so there's no private key to guard.",
    },
    {
      title: "Shielded Liquidity",
      body: "Your money sits in a shared anonymity set, which is why your onchain balance reads as null. Privacy isn't a mode you switch on. It's how every account starts.",
    },
    {
      title: "Invisible Execution",
      body: "Relayers pay the gas and route each transaction. You approve the payment and nothing more, so no address of yours is ever recorded.",
    },
  ],
};

/* ---------------------------------------------------------------- HOW IT WORKS (layers) */

export const LAYERS = {
  label: "How it works",
  h2a: "Four layers, ",
  h2b: "one quiet payment.",
  lead: "Each layer does one job and can be upgraded without touching the others. Together they turn a sign-in into a settled payment in under two seconds.",
  items: [
    {
      id: "identity",
      tab: "Identity & Auth",
      tags: ["ZK Login", "Credential issuance"],
      body: "Your usual Google or email sign-in is exchanged for a zero-knowledge credential. It shows you're entitled to the account and nothing more, so there's no key to lose and nothing for a phisher to steal.",
    },
    {
      id: "liquidity",
      tab: "Privacy Liquidity",
      tags: ["Shielded pools", "UTXO model"],
      body: "Each deposit becomes a commitment in a UTXO set inside the shielded pool. There's no account balance to query, only notes that a valid proof is allowed to spend.",
    },
    {
      id: "execution",
      tab: "Execution Layer",
      tags: ["Relayers", "Gas abstraction"],
      body: "A relayer takes your signed proof, covers the gas and submits it. Because the relayer pays, the transaction never points back to an address you hold.",
    },
    {
      id: "settlement",
      tab: "Settlement Layer",
      tags: ["Stablecoins", "Onchain finality"],
      body: "Funds leave the pool as stablecoins backed one to one and settle with onchain finality. The merchant receives a transfer that looks like any other transfer.",
    },
  ],
  trace: {
    title: "Payment trace",
    running: "Running",
    done: "Settled",
    lines: [
      ["00.000", "sign-in", "credential 0x9c41…a7d2 ready"],
      ["00.038", "limit", "60 of 500 USDC used today"],
      ["00.040", "merchant", "found on your allowlist"],
      ["00.176", "proof", "permission proven"],
      ["00.590", "relayer", "gas covered, tx submitted"],
      ["01.712", "settle", "42.00 USDC paid to merchant"],
      ["01.713", "ledger", "your address: not recorded"],
    ] as [string, string, string][],
  },
  note: "Each line is one of your own rules being checked. If a rule fails, nothing gets signed.",
};

/* ---------------------------------------------------------------- SETTLEMENT */

export const SETTLEMENT = {
  label: "Settlement",
  h2a: "Quiet at the counter. ",
  h2b: "Clean at the bank.",
  lead: "Your privacy ends where the merchant's books begin. They receive ordinary USDC or USDT that they can deposit, reconcile and show an auditor like any other payment.",
  panelLabel: "Proof to payout",
  big: "< 2s",
  bigUnit: "to settle",
  bars: [
    { k: "Paid to the merchant in standard USDC or USDT", v: "100%", fill: 1 },
    { k: "Your payment history the merchant can see", v: "0%", fill: 0 },
  ],
  panelNote: "Timed from proof check to stablecoin payout on Robinhood Chain.",
  stats: [
    {
      value: "$",
      key: "Clean settlement",
      desc: "Merchants get plain USDC or USDT. No taint, no attached history, only the amount they're owed.",
    },
    {
      value: "100%",
      key: "Regulatory compliance",
      desc: "The protocol itself enforces daily limits, merchant allowlists and signed audit reports.",
    },
    {
      value: "< 2s",
      key: "Settlement time",
      desc: "A payment is verified and paid out in under two seconds on Robinhood Chain.",
    },
  ],
};

/* ---------------------------------------------------------------- TOKEN (pinned stage) */

export const STAGE = {
  label: "The $CASSA economy",
  lines: ["Nothing to look up.", "Nothing to trace."],
  after: "One token, four jobs. Each card is a reason $CASSA exists.",
};

export const TOKEN = {
  tabs: [
    {
      idx: "01",
      tab: "Relayer Incentives",
      title: "Relayers earn $CASSA for every proof they process",
      fig: { v: "1,240", k: "$CASSA per relayer, weekly" },
    },
    {
      idx: "02",
      tab: "Governance Rights",
      title: "Holders vote on the rules the circuits enforce",
      fig: { v: "P4", k: "Proposal open now" },
    },
    {
      idx: "03",
      tab: "Fee Shielding",
      title: "Pay fees in $CASSA and keep gas off your stablecoins",
      fig: { v: "-25%", k: "Off every fee" },
    },
    {
      idx: "04",
      tab: "Protocol Treasury",
      title: "A share of fees pays for audits and new circuits",
      fig: { v: "18%", k: "Of fees to treasury" },
    },
  ],
};

/* ---------------------------------------------------------------- ROADMAP */

export const ROADMAP = {
  label: "Roadmap",
  h2a: "Where CassaFi ",
  h2b: "goes next.",
  lead: "Four phases, from the first private payment to institutions running payroll off the record.",
  steps: [
    {
      k: "01. Core infra",
      title: "Core infrastructure",
      body: "ZK Login, the shielded pool and the first relayers working together end to end.",
      done: true,
    },
    {
      k: "02. Compliance",
      title: "Compliance",
      body: "Daily limits, merchant allowlists and automatic audit reports, so private spending is also safe spending.",
      done: true,
    },
    {
      k: "03. Growth",
      title: "Growth",
      body: "$CASSA goes live, anyone can run a relayer, and private settlement reaches more chains.",
      done: false,
    },
    {
      k: "04. Scale",
      title: "Scale",
      body: "Recurring payments, private payroll and treasury accounts for institutions that need discretion and an audit trail at the same time.",
      done: false,
    },
  ],
};

/* ---------------------------------------------------------------- FAQ */

export const FAQ = {
  label: "FAQ",
  h2a: "Questions, ",
  h2b: "answered plainly.",
  cta: "Open the app",
  items: [
    {
      q: "What is CassaFi?",
      a: "An onchain neobank where spending is based on permission, not ownership. Instead of a public wallet you hold a zero-knowledge credential. Your money sits in a shielded pool, relayers submit your payments, and merchants receive normal stablecoins.",
    },
    {
      q: "Where does my money live if I have no address?",
      a: "Each deposit becomes a note in a shared shielded pool. Only a valid proof can spend it, and nothing in the pool carries your name or an address. That's why nobody can look up your balance or link one of your payments to the next.",
    },
    {
      q: "What does paying by permission look like?",
      a: "At checkout you don't show a key that says the money is yours. You show a proof that a rule allows this payment: your credential is valid, the note is unspent, and the amount fits your limit. The protocol checks the proof and the merchant gets paid.",
    },
    {
      q: "Does CassaFi work with regulation?",
      a: "It was designed for it. The circuits enforce your limits, allowlists and signed audit reports, so an auditor can receive a report they can verify without anyone publishing a spending history. Merchants receive clean USDC or USDT.",
    },
    {
      q: "Who pays for gas?",
      a: "Relayers do. They take your proof, cover the network fee and submit the transaction, which keeps your own addresses off the chain. They earn $CASSA for it.",
    },
    {
      q: "What is $CASSA used for?",
      a: "It pays relayers for the proofs they process. It gives holders a vote on verification keys, spending limits and compliance policy. You can also pay transaction fees with it at 25 percent off, so gas never touches your stablecoin balance.",
    },
    {
      q: "What happens if I lose my phone?",
      a: "There's no seed phrase to lose. Your credential is issued again from the same zero-knowledge sign-in you used the first time, and recovering it doesn't reveal who you are.",
    },
  ],
};

/* ---------------------------------------------------------------- FOOTER */

export const FOOTER = {
  h2a: "Keep your money ",
  h2b: "to yourself.",
  sub: "Get your credential in a couple of minutes and make your first private payment today.",
  cta: { label: "Open an account", href: "/app" },
  ctaSecondary: { label: "How it works", href: "#layers" },
  built: "Made for private money.",
  blurb:
    "CassaFi is an onchain neobank built on authorization. Prove you may spend, keep your balance to yourself, and settle in stablecoins any business can bank.",
  newsletter: {
    label: "Release notes",
    placeholder: "Your email",
    button: "Subscribe",
    success: "You're on the list. Release notes and privacy updates will come to your inbox.",
    error: "That address doesn't look right. Check it and try again.",
  },
  app: {
    label: "Mobile app",
    body: "CassaFi for iOS and Android.",
    android: {
      label: "Download for Android",
      meta: "APK · 1.0.0 · 52 MB",
      // Served from this site (public/downloads/). vercel.json makes it a download named CassaFi.apk.
      href: "/downloads/CassaFi.apk",
      filename: "CassaFi.apk",
    },
    ios: {
      label: "iPhone",
      badge: "Coming soon",
    },
  },
  columns: [
    {
      head: "Product",
      links: [
        { label: "Open the app", href: "/app" },
        { label: "ZK Login", href: "/app/credential" },
        { label: "Shielded Pools", href: "#paradigm" },
        { label: "Proof-Based Authorization", href: "/app/pay" },
        { label: "Relayer Network", href: "#layers" },
        { label: "$CASSA Token", href: "#token" },
      ],
    },
    {
      head: "Learn",
      links: [
        { label: "How it works", href: "#layers" },
        { label: "Settlement", href: "#settlement" },
        { label: "Roadmap", href: "#roadmap" },
        { label: "FAQ", href: "#faq" },
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
  legal: [
    { label: "Terms", href: "#footer" },
    { label: "Privacy", href: "#footer" },
    { label: "Cookies", href: "#footer" },
  ],
};

/** Social accounts. Add more entries here if CassaFi opens other profiles. */
export const SOCIALS = [{ key: "x", label: "CassaFi on X", handle: "@CassaFiMoney", href: "https://x.com/CassaFiMoney" }];
