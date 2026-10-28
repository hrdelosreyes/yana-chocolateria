import { NextResponse } from "next/server";
import {
  buildOrder,
  OrderError,
  orderEmailHtml,
  orderPurpose,
  saveOrder,
  setHitpayRequest,
  type CheckoutRequest,
} from "@/lib/order";
import { createPaymentRequest } from "@/lib/hitpay";
import { hasDatabase } from "@/lib/db";
import { sendEmail } from "@/lib/email";

export async function POST(request: Request) {
  let order;
  try {
    order = await buildOrder((await request.json()) as CheckoutRequest);
  } catch (err) {
    if (!(err instanceof OrderError)) console.error(err);
    const message = err instanceof OrderError ? err.message : "Invalid order.";
    return NextResponse.json({ error: message }, { status: 400 });
  }

  const siteUrl = (process.env.SITE_URL || new URL(request.url).origin).replace(/\/$/, "");
  try {
    if (hasDatabase) await saveOrder(order);
    const payment = await createPaymentRequest({
      amount: order.total,
      reference: order.reference,
      purpose: orderPurpose(order),
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      redirectUrl: `${siteUrl}/order/complete?ref=${order.reference}`,
      webhookUrl: `${siteUrl}/api/hitpay/webhook`,
    });

    if (hasDatabase) {
      await setHitpayRequest(order.reference, payment.id);
    } else if (process.env.ORDER_EMAIL_TO) {
      // Without a database the order details only exist in this email.
      await sendEmail({
        to: process.env.ORDER_EMAIL_TO,
        subject: `New order ${order.reference} (awaiting payment)`,
        html: orderEmailHtml(order, "New order – awaiting payment"),
        replyTo: order.customer.email,
      });
    }
    return NextResponse.json({ url: payment.url, reference: order.reference });
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "We couldn't start the payment. Please try again or contact us." },
      { status: 502 },
    );
  }
}
