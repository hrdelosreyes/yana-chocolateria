import { NextResponse } from "next/server";
import { getPaymentRequest, verifyFormWebhook, verifyJsonWebhook } from "@/lib/hitpay";
import { escapeHtml, sendEmail } from "@/lib/email";
import { site } from "@/lib/site";

type Paid = { paymentRequestId: string; reference: string; amount: string; status: string };

function parse(raw: string, contentType: string, signature: string | null): Paid | null {
  if (contentType.includes("application/json")) {
    if (!verifyJsonWebhook(raw, signature)) return null;
    const data = JSON.parse(raw);
    return {
      paymentRequestId: String(data.payment_request?.id ?? data.payment_request_id ?? ""),
      reference: String(data.reference_number ?? data.payment_request?.reference_number ?? ""),
      amount: String(data.amount ?? ""),
      status: String(data.status ?? ""),
    };
  }
  const fields = Object.fromEntries(new URLSearchParams(raw));
  if (!verifyFormWebhook(fields)) return null;
  return {
    paymentRequestId: fields.payment_request_id ?? "",
    reference: fields.reference_number ?? "",
    amount: fields.amount ?? "",
    status: fields.status ?? "",
  };
}

export async function POST(request: Request) {
  const raw = await request.text();
  const paid = parse(raw, request.headers.get("content-type") ?? "", request.headers.get("hitpay-signature"));
  if (!paid) return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  if (paid.status !== "completed" && paid.status !== "succeeded") return NextResponse.json({ ok: true });

  let details = { name: "", email: "", phone: "", purpose: "" };
  try {
    const pr = await getPaymentRequest(paid.paymentRequestId);
    details = { name: pr.name ?? "", email: pr.email ?? "", phone: pr.phone ?? "", purpose: pr.purpose ?? "" };
  } catch (err) {
    console.error(err);
  }

  const summary = `<p><strong>Order:</strong> ${escapeHtml(paid.reference)}<br><strong>Amount paid:</strong> ₱${escapeHtml(paid.amount)}</p>
<p>${escapeHtml(details.purpose)}</p>`;

  const to = process.env.ORDER_EMAIL_TO;
  if (to) {
    await sendEmail({
      to,
      subject: `PAID: order ${paid.reference}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px"><h2>Payment received</h2>${summary}
<p><strong>Customer:</strong> ${escapeHtml(details.name)}<br>${escapeHtml(details.email)}<br>${escapeHtml(details.phone)}</p>
<p>See the "awaiting payment" email for this order number for pickup or delivery details.</p></div>`,
      replyTo: details.email || undefined,
    });
  }
  if (details.email) {
    await sendEmail({
      to: details.email,
      subject: `Thank you for your order ${paid.reference}`,
      html: `<div style="font-family:Arial,sans-serif;font-size:14px"><h2>Thank you, ${escapeHtml(details.name)}!</h2>
<p>We've received your payment and are preparing your order. We'll contact you about pickup or delivery.</p>${summary}
<p>Questions? Email ${site.email} or call ${site.phone}.</p></div>`,
      replyTo: to,
    });
  }
  return NextResponse.json({ ok: true });
}
