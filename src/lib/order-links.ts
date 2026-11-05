import { createHmac, timingSafeEqual } from "node:crypto";

// Order tracking links carry a signature so that only someone who received the
// link (the customer, by email) can open the order without typing their details.
function secret() {
  const value = process.env.ORDER_LINK_SECRET || process.env.HITPAY_SALT;
  if (!value) throw new Error("ORDER_LINK_SECRET is not set");
  return value;
}

export function orderToken(reference: string) {
  return createHmac("sha256", secret()).update(`order:${reference}`).digest("hex").slice(0, 32);
}

export function verifyOrderToken(reference: string, token: string) {
  const expected = Buffer.from(orderToken(reference));
  const given = Buffer.from(token);
  return expected.length === given.length && timingSafeEqual(expected, given);
}

export function siteUrl() {
  return (process.env.SITE_URL || "https://yanachocolateria.com").replace(/\/$/, "");
}

export function trackOrderUrl(reference: string) {
  return `${siteUrl()}/order/track?ref=${encodeURIComponent(reference)}&t=${orderToken(reference)}`;
}
