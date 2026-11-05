import { revalidatePath } from "next/cache";
import { getPaymentRequest } from "@/lib/hitpay";
import { sendEmail } from "@/lib/email";
import { getPendingHitpayRequest, markOrderPaid, orderEmailHtml, type Order } from "@/lib/order";
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
