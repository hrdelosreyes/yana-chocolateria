import { createHmac, timingSafeEqual } from "node:crypto";

function apiBase() {
  if (process.env.HITPAY_API_BASE) return process.env.HITPAY_API_BASE; // for local testing
  return process.env.HITPAY_MODE === "live" ? "https://api.hit-pay.com/v1" : "https://api.sandbox.hit-pay.com/v1";
}

function apiKey() {
  const key = process.env.HITPAY_API_KEY;
  if (!key) throw new Error("HITPAY_API_KEY is not set");
  return key;
}

export type PaymentRequestInput = {
  amount: number; // centavos
  reference: string;
  purpose: string;
  name: string;
  email: string;
  phone: string;
  redirectUrl: string;
  webhookUrl: string;
};

export type PaymentRequest = {
  id: string;
  url: string;
  status: string;
  amount: string;
  reference_number: string | null;
  purpose: string | null;
  name: string | null;
  email: string | null;
  phone: string | null;
  payments?: { id: string; status: string; amount: string }[];
};

export async function createPaymentRequest(input: PaymentRequestInput): Promise<PaymentRequest> {
  const body = new URLSearchParams({
    amount: (input.amount / 100).toFixed(2),
    currency: "PHP",
    reference_number: input.reference,
    purpose: input.purpose,
    name: input.name,
    email: input.email,
    phone: input.phone,
    redirect_url: input.redirectUrl,
    webhook: input.webhookUrl,
    send_email: "true",
  });
  const res = await fetch(`${apiBase()}/payment-requests`, {
    method: "POST",
    headers: {
      "X-BUSINESS-API-KEY": apiKey(),
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });
  if (!res.ok) {
    throw new Error(`HitPay payment request failed (${res.status}): ${await res.text()}`);
  }
  return res.json();
}

export async function getPaymentRequest(id: string): Promise<PaymentRequest> {
  const res = await fetch(`${apiBase()}/payment-requests/${encodeURIComponent(id)}`, {
    headers: { "X-BUSINESS-API-KEY": apiKey(), "X-Requested-With": "XMLHttpRequest" },
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`HitPay lookup failed (${res.status})`);
  return res.json();
}

// An error response from HitPay's API, with its own message when it sends one.
export class HitPayError extends Error {
  constructor(
    public status: number,
    public body: string,
  ) {
    let detail = body.slice(0, 300);
    try {
      const data = JSON.parse(body);
      const errors = data.errors ? Object.values(data.errors).flat().join(" ") : "";
      detail = [data.message, errors].filter(Boolean).join(" ") || detail;
    } catch {}
    super(`HitPay error ${status}: ${detail}`);
  }
}

export type Refund = { id: string; payment_id: string; amount_refunded: number | string; status: string };

export async function refundPayment(paymentId: string, amount: number): Promise<Refund> {
  const res = await fetch(`${apiBase()}/refund`, {
    method: "POST",
    headers: {
      "X-BUSINESS-API-KEY": apiKey(),
      "X-Requested-With": "XMLHttpRequest",
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({ payment_id: paymentId, amount: (amount / 100).toFixed(2) }),
  });
  if (!res.ok) throw new HitPayError(res.status, await res.text());
  return res.json();
}

function safeEqual(a: string, b: string) {
  const ab = Buffer.from(a);
  const bb = Buffer.from(b);
  return ab.length === bb.length && timingSafeEqual(ab, bb);
}

// The API salt signs the confirmation sent for each payment request; a webhook
// registered in the HitPay dashboard has its own salt. Accept either.
function salts() {
  const values = [process.env.HITPAY_SALT, process.env.HITPAY_WEBHOOK_SALT].filter((v): v is string => Boolean(v));
  if (values.length === 0) throw new Error("HITPAY_SALT is not set");
  return values;
}

function signedBy(message: string, signature: string) {
  return salts().some((salt) => safeEqual(createHmac("sha256", salt).update(message).digest("hex"), signature));
}

// Payment request webhook (form-encoded): HMAC-SHA256 over the fields sorted by
// key and joined as key+value, excluding the hmac field itself.
export function verifyFormWebhook(fields: Record<string, string>) {
  const { hmac, ...rest } = fields;
  if (!hmac) return false;
  const message = Object.keys(rest)
    .sort()
    .map((k) => k + rest[k])
    .join("");
  return signedBy(message, hmac);
}

// Event webhooks (JSON): HMAC-SHA256 of the raw body in the Hitpay-Signature header.
export function verifyJsonWebhook(rawBody: string, signature: string | null) {
  return Boolean(signature) && signedBy(rawBody, signature!);
}
