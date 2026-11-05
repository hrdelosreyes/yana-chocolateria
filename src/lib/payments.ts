import { revalidatePath } from "next/cache";
import { getPaymentRequest, refundPayment } from "@/lib/hitpay";
import { sendEmail } from "@/lib/email";
import { getOrder, getPendingHitpayRequest, markOrderPaid, orderEmailHtml, recordRefund, type Order } from "@/lib/order";
import { site } from "@/lib/site";

// Emails the shop and the customer once an order is paid.
export async function notifyPaid(order: Order) {
  revalidatePath("/", "layout"); // stock may have changed
  const shopEmail = process.env.ORDER_EMAIL_TO;
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
}

// Asks HitPay directly whether a pending order has been paid, as a backup for the
// webhook. Returns true if the order is (now) marked paid by this call.
export async function syncOrderPayment(reference: string) {
  const requestId = await getPendingHitpayRequest(reference);
  if (!requestId) return false;
  const pr = await getPaymentRequest(requestId);
  if (pr.status !== "completed") {
    console.info(`HitPay sync: order ${reference} payment request is ${pr.status}`);
    return false;
  }
  const payment = pr.payments?.find((p) => p.status === "succeeded") ?? pr.payments?.[0];
  const order = await markOrderPaid({
    reference,
    requestId: pr.id,
    paymentId: payment?.id ?? "",
    amount: pr.amount,
  });
  if (!order) return false;
  console.info(`HitPay sync: order ${reference} marked paid`);
  await notifyPaid(order);
  return true;
}

export class RefundError extends Error {}

// Refunds the full amount of a paid order through HitPay and cancels the order.
export async function refundOrder(reference: string) {
  const order = await getOrder(reference);
  if (!order) throw new RefundError("Order not found.");
  if (order.refundedAt) throw new RefundError("This order has already been refunded.");
  if (!order.paidAt) throw new RefundError("This order was never paid, so there's nothing to refund.");

  let paymentId = order.hitpayPaymentId || "";
  if (!paymentId && order.hitpayRequestId) {
    const pr = await getPaymentRequest(order.hitpayRequestId);
    paymentId = (pr.payments?.find((p) => p.status === "succeeded") ?? pr.payments?.[0])?.id ?? "";
  }
  if (!paymentId) {
    throw new RefundError("HitPay's payment ID for this order is missing. Please refund it from the HitPay dashboard.");
  }

  const refund = await refundPayment(paymentId, order.total);
  await recordRefund(reference, { amount: order.total, refundId: String(refund.id ?? ""), paymentId });
  revalidatePath("/", "layout"); // stock may have changed
  console.info(`HitPay refund: order ${reference} refunded`);
}
