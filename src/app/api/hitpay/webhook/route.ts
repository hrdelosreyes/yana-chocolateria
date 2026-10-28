import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { getPaymentRequest, verifyFormWebhook, verifyJsonWebhook } from "@/lib/hitpay";
import { escapeHtml, sendEmail } from "@/lib/email";
import { hasDatabase } from "@/lib/db";
import { markOrderPaid, orderEmailHtml } from "@/lib/order";
import { site } from "@/lib/site";

type Paid = { paymentRequestId: string; paymentId: string; reference: string; amount: string; status: string };

function parse(raw: string, contentType: string, signature: string | null): Paid | null {
  if (contentType.includes("application/json")) {
    if (!verifyJsonWebhook(raw, signature)) return null;
    const data = JSON.parse(raw);
    return {
      paymentRequestId: String(data.payment_request?.id ?? data.payment_request_id ?? ""),
      paymentId: String(data.id ?? data.payment_id ?? ""),
      reference: String(data.reference_number ?? data.payment_request?.reference_number ?? ""),
      amount: String(data.amount ?? ""),
      status: String(data.status ?? ""),
    };
  }
  const fields = Object.fromEntries(new URLSearchParams(raw));
  if (!verifyFormWebhook(fields)) return null;
  return {
    paymentRequestId: fields.payment_request_id ?? "",
    paymentId: fields.payment_id ?? "",
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

  const shopEmail = process.env.ORDER_EMAIL_TO;

  if (hasDatabase) {
    let order;
    try {
      order = await markOrderPaid({
        reference: paid.reference,
        requestId: paid.paymentRequestId,
        paymentId: paid.paymentId,
        amount: paid.amount,
      });
    } catch (err) {
      console.error(err);
      if (shopEmail) {
        await sendEmail({
          to: shopEmail,
          subject: `CHECK PAYMENT: order ${paid.reference}`,
          html: `<p>HitPay reported a payment of ₱${escapeHtml(paid.amount)} for order ${escapeHtml(paid.reference)}, but it doesn't match the order total. Please check it in HitPay and the admin page.</p>`,
        });
      }
      return NextResponse.json({ ok: true });
    }
    if (!order) return NextResponse.json({ ok: true }); // already handled

    revalidatePath("/", "layout"); // stock may have changed
    if (shopEmail) {
      await sendEmail({
        to: shopEmail,
        subject: `PAID: order ${order.reference}`,
        html: orderEmailHtml(order, "New paid order"),
        replyTo: order.customer.email,
      });
    }
    await sendEmail({
      to: order.customer.email,
      subject: `Thank you for your order ${order.reference}`,
      html: orderEmailHtml(
        order,
        `Thank you, ${order.customer.name}!`,
        `We've received your payment and are preparing your order. We'll contact you about pickup or delivery. Questions? Email ${site.email} or call ${site.phone}.`,
      ),
      replyTo: shopEmail,
    });
    return NextResponse.json({ ok: true });
  }

  // No database: details come from HitPay; the full order is in the "awaiting payment" email.
  let details = { name: "", email: "", phone: "", purpose: "" };
  try {
    const pr = await getPaymentRequest(paid.paymentRequestId);
    details = { name: pr.name ?? "", email: pr.email ?? "", phone: pr.phone ?? "", purpose: pr.purpose ?? "" };
  } catch (err) {
    console.error(err);
  }
  const summary = `<p><strong>Order:</strong> ${escapeHtml(paid.reference)}<br><strong>Amount paid:</strong> ₱${escapeHtml(paid.amount)}</p>
<p>${escapeHtml(details.purpose)}</p>`;
  if (shopEmail) {
    await sendEmail({
      to: shopEmail,
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
      replyTo: shopEmail,
    });
  }
  return NextResponse.json({ ok: true });
}
