import { encodeAbiParameters, keccak256, type Hex } from "viem";

/**
 * The CassaFi card attached to a credential.
 *
 * Every value is derived from the credential ID, so the same credential always
 * shows the same card and nothing extra needs storing. The number follows the
 * standard card formats (Visa 4, Mastercard 51-55 / 2221-2720, Discover 6011),
 * is 16 digits long, and ends in a proper Luhn check digit.
 */
export type CardNetwork = "visa" | "mastercard" | "discover";
export type BankCardData = { number: string; cvv: string; expiry: string; last4: string; network: CardNetwork };

const networkOf = (n: string): CardNetwork => (n.startsWith("4") ? "visa" : n.startsWith("6011") ? "discover" : "mastercard");

/** Issuer prefixes, picked per credential. */
const PREFIXES = ["4", "4", "51", "52", "53", "54", "55", "2221", "2720", "6011"];

function luhnCheckDigit(partial: string) {
  let sum = 0;
  // Walking right to left over the partial number, double every first digit.
  for (let i = 0; i < partial.length; i++) {
    let d = Number(partial[partial.length - 1 - i]);
    if (i % 2 === 0) {
      d *= 2;
      if (d > 9) d -= 9;
    }
    sum += d;
  }
  return String((10 - (sum % 10)) % 10);
}

export const luhnValid = (n: string) => luhnCheckDigit(n.slice(0, -1)) === n.slice(-1);

export function deriveCard(credentialId: Hex, issuedAt: number): BankCardData {
  const h = keccak256(encodeAbiParameters([{ type: "bytes32" }, { type: "string" }], [credentialId, "cassafi.card.v1"]));
  const digits = h
    .slice(2)
    .match(/.{2}/g)!
    .map((b) => String(parseInt(b, 16) % 10))
    .join("");
  const prefix = PREFIXES[parseInt(h.slice(-2), 16) % PREFIXES.length];
  const body = prefix + digits.slice(0, 15 - prefix.length);
  const number = body + luhnCheckDigit(body);
  const cvv = digits.slice(16, 19);
  const exp = new Date(issuedAt);
  const month = String(exp.getMonth() + 1).padStart(2, "0");
  const year = String((exp.getFullYear() + 4) % 100).padStart(2, "0");
  return { number, cvv, expiry: `${month}/${year}`, last4: number.slice(-4), network: networkOf(number) };
}

export const groupCard = (n: string) => n.replace(/(\d{4})(?=\d)/g, "$1 ");

/** Names as printed on a card: letters, spaces, apostrophes, dots and hyphens, 2 to 26 characters. */
export function normalizeHolder(input: string): { value: string; error: string | null } {
  const value = input.replace(/\s+/g, " ").trim();
  if (value.length < 2) return { value, error: "Enter the name for your card." };
  if (value.length > 26) return { value, error: "Card names can be up to 26 characters." };
  if (!/^[\p{L}][\p{L} .'-]*$/u.test(value)) return { value, error: "Use letters, spaces, apostrophes or hyphens only." };
  return { value, error: null };
}
