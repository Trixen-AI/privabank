import { useState } from "react";
import { Eye, EyeOff, RefreshCw, Wifi } from "lucide-react";
import { Logomark, Wordmark } from "../../components/ui/Logo";
import { groupCard, type BankCardData, type CardNetwork } from "../lib/card";
import { CopyButton } from "./kit";
// Card network marks, inlined byte-for-byte (resize only). The brand portals
// (brand.visa.com, mastercard.com/brandcenter) require sign-in or block
// automated download, so these are the Wikimedia Commons copies of the current
// official artwork; swap in the brand-kit files when available:
//   Visa        commons.wikimedia.org/wiki/File:Visa_Inc._logo_(2021–present).svg
//   Mastercard  commons.wikimedia.org/wiki/File:Mastercard_2019_logo.svg
//   Discover    commons.wikimedia.org/wiki/File:Discover_Card_logo.svg
// On the dark card, CSS applies the reversed (white) variant each brand kit
// provides for dark backgrounds; shapes and proportions are untouched.
import visaMark from "../../assets/networks/visa.svg?raw";
// Mastercard's file has width/height but no viewBox, so inlined it would crop
// instead of scale; as an <img> the browser scales the whole drawing.
import mastercardUrl from "../../assets/networks/mastercard.svg";
import discoverMark from "../../assets/networks/discover.svg?raw";

const NETWORK: Record<CardNetwork, { svg?: string; src?: string; label: string }> = {
  visa: { svg: visaMark, label: "Visa" },
  mastercard: { src: mastercardUrl, label: "Mastercard" },
  discover: { svg: discoverMark, label: "Discover" },
};

/**
 * The CassaFi card: front with number, holder and expiry; back with the
 * signature strip and CVV. Number and CVV stay masked until the holder
 * reveals them, the way a banking app shows card details.
 */
export function BankCard({
  card,
  holder,
  size = "lg",
  controls = true,
}: {
  card: BankCardData;
  holder: string;
  size?: "lg" | "sm";
  controls?: boolean;
}) {
  const [revealed, setRevealed] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const number = revealed ? groupCard(card.number) : `•••• •••• •••• ${card.last4}`;

  return (
    <div className={`bcard-wrap bcard-wrap--${size}`}>
      <div className={`bcard${flipped ? " flipped" : ""}`}>
        <div className="bcard-face bcard-front" aria-hidden={flipped}>
          <div className="bcard-glow" />
          <div className="bcard-dots" />
          <div className="bcard-row">
            <span className="bcard-brand">
              <Logomark inverted className="bcard-mark" />
              <Wordmark className="bcard-word" />
            </span>
            <Wifi className="bcard-nfc" size={size === "lg" ? 22 : 16} aria-hidden="true" />
          </div>
          <div className="bcard-chip" aria-hidden="true">
            <span />
            <span />
            <span />
          </div>
          <div className="bcard-number" aria-label={revealed ? `Card number ${card.number}` : `Card ending in ${card.last4}`}>
            {number}
          </div>
          <div className="bcard-row bcard-foot">
            <span className="bcard-holder">
              <span className="bcard-k">Card holder</span>
              <span className="bcard-v">{holder.toUpperCase()}</span>
            </span>
            <span>
              <span className="bcard-k">Valid thru</span>
              <span className="bcard-v">{card.expiry}</span>
            </span>
            {NETWORK[card.network].src ? (
              <img className={`bcard-net bcard-net--${card.network}`} src={NETWORK[card.network].src} alt={NETWORK[card.network].label} />
            ) : (
              <span
                className={`bcard-net bcard-net--${card.network}`}
                role="img"
                aria-label={NETWORK[card.network].label}
                dangerouslySetInnerHTML={{ __html: NETWORK[card.network].svg! }}
              />
            )}
          </div>
        </div>

        <div className="bcard-face bcard-back" aria-hidden={!flipped}>
          <div className="bcard-stripe" />
          <div className="bcard-sig">
            <span className="bcard-sig-line">{holder}</span>
            <span className="bcard-cvv" aria-label={revealed ? `CVV ${card.cvv}` : "CVV hidden"}>
              {revealed ? card.cvv : "•••"}
            </span>
          </div>
          <p className="bcard-fine">
            Issued by CassaFi Labs against your spending credential. Payments made with this card are authorized by
            credential and settle in stablecoins.
          </p>
          <span className="bcard-back-brand">
            <Logomark inverted className="bcard-mark" />
          </span>
        </div>
      </div>

      {controls ? (
        <div className="bcard-controls">
          <button type="button" className="btn btn-sec btn-sm" onClick={() => setRevealed((v) => !v)} aria-pressed={revealed}>
            {revealed ? <EyeOff size={15} /> : <Eye size={15} />} {revealed ? "Hide details" : "Show details"}
          </button>
          <button type="button" className="btn btn-sec btn-sm" onClick={() => setFlipped((v) => !v)} aria-pressed={flipped}>
            <RefreshCw size={15} /> {flipped ? "Front" : "Back"}
          </button>
          {revealed ? (
            <span className="bcard-copy">
              Number <CopyButton value={card.number} label="Copy card number" />
            </span>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
