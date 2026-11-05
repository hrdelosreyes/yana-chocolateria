import { revalidatePath } from "next/cache";
import { getPaymentRequest, refundPayment } from "@/lib/hitpay";
import { sendEmail } from "@/lib/email";
import { formatPrice } from "@/lib/money";
import { trackOrderUrl } from "@/lib/order-links";
import {
  getOrder,
  getPendingHitpayRequest,
  updateOrderStatus,
  markOrderPaid,
  orderEmailHtml,
  recordRefund,
  type Order,
  type OrderStatus,
} from "@/lib/order";
import { site } from "@/lib/site";

const contactLine = `Questions? Email ${site.email} or call ${site.phone}.`;

function emailCustomer(order: Order, subject: string, heading: string, intro: string) {
  return sendEmail({
    to: order.customer.email,
    subject,
    html: orderEmailHtml(order, heading, `${intro} ${contactLine}`, {
      href: trackOrderUrl(order.reference),
      label: "Track your order",
    }),
    replyTo: process.env.ORDER_EMAIL_TO,
  });
}

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
  await emailCustomer(
    order,
    `Thank you for your order ${order.reference}`,
    `Thank you, ${order.customer.name}!`,
    "We've received your payment and are preparing your order. We'll email you when it's ready.",
  );
}

const paidStatuses: OrderStatus[] = ["paid", "preparing", "ready", "completed"];

// Tells the customer when the shop marks their order ready, or cancels a paid order.
export async function notifyStatusChange(reference: string, previous: OrderStatus) {
  const order = await getOrder(reference);
  if (!order) return;
  if (order.status === "ready") {
    const pickup = order.fulfillmentMethod === "pickup";
    await emailCustomer(
      order,
      pickup ? `Your order ${order.reference} is ready for pickup` : `Your order ${order.reference} is on its way`,
      pickup ? "Your order is ready for pickup" : "Your order is on its way",
      pickup
        ? `${order.fulfillmentText.replace(/^Pickup at /, "You can pick it up at ")}. Please bring your order number.`
        : "We've handed your order to the courier. Please keep your phone nearby so the rider can reach you.",
    );
  } else if (order.status === "cancelled" && paidStatuses.includes(previous) && !order.refundedAt) {
    await emailCustomer(
      order,
      `Your order ${order.reference} has been cancelled`,
      "Your order has been cancelled",
      "We've cancelled your order. We'll contact you about your refund.",
    );
  }
}

function notifyRefunded(order: Order) {
  return emailCustomer(
    order,
    `Refund for your order ${order.reference}`,
    "Your order has been refunded",
    order.refundMethod === "hitpay"
      ? `We've refunded ${formatPrice(order.refundAmount ?? order.total)} to your original payment method. Depending on your bank or e-wallet, it may take a few days to appear.`
      : `We've refunded ${formatPrice(order.refundAmount ?? order.total)} for this order.`,
  );
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

async function refundableOrder(reference: string) {
  const order = await getOrder(reference);
  if (!order) throw new RefundError("Order not found.");
  if (order.refundedAt) throw new RefundError("This order has already been refunded.");
  if (!order.paidAt) throw new RefundError("This order was never paid, so there's nothing to refund.");
  return order;
}

async function finishRefund(reference: string) {
  revalidatePath("/", "layout"); // stock may have changed
  const order = await getOrder(reference);
  if (order) await notifyRefunded(order);
}

async function refundThroughHitpay(order: Order) {
  let paymentId = order.hitpayPaymentId || "";
  if (!paymentId && order.hitpayRequestId) {
    const pr = await getPaymentRequest(order.hitpayRequestId);
    paymentId = (pr.payments?.find((p) => p.status === "succeeded") ?? pr.payments?.[0])?.id ?? "";
  }
  if (!paymentId) {
    throw new RefundError("HitPay's payment ID for this order is missing. Please refund it from the HitPay dashboard.");
  }

  const refund = await refundPayment(paymentId, order.total);
  await recordRefund(order.reference, {
    amount: order.total,
    method: "hitpay",
    refundId: String(refund.id ?? ""),
    paymentId,
  });
  console.info(`HitPay refund: order ${order.reference} refunded`);
}

// Refunds the full amount of a paid order through HitPay and cancels the order.
export async function refundOrder(reference: string) {
  await refundThroughHitpay(await refundableOrder(reference));
  await finishRefund(reference);
}

export class CancelError extends Error {}

// Lets a customer cancel an order that's paid but not yet being prepared. The order is
// cancelled first; the refund is tried through HitPay, and if HitPay can't refund the
// payment method, the shop is asked to refund it by hand.
export async function cancelByCustomer(reference: string) {
  const previous = await updateOrderStatus(reference, "cancelled", "paid");
  if (!previous) {
    throw new CancelError(
      "Your order is already being prepared, so it can't be cancelled online. Please contact us and we'll help.",
    );
  }
  revalidatePath("/", "layout"); // stock changed
  let order = (await getOrder(reference))!;
  let refunded = false;
  try {
    await refundThroughHitpay(order);
    refunded = true;
    order = (await getOrder(reference))!;
  } catch (err) {
    console.warn(`Customer cancelled ${reference}; HitPay refund failed, shop must refund manually`, err);
  }
  console.info(`Order ${reference} cancelled by customer${refunded ? " and refunded" : ""}`);

  const shopEmail = process.env.ORDER_EMAIL_TO;
  if (shopEmail) {
    await sendEmail({
      to: shopEmail,
      subject: refunded
        ? `CANCELLED by customer: order ${reference} (refunded)`
        : `CANCELLED by customer: order ${reference} (please refund ${formatPrice(order.total)})`,
      html: orderEmailHtml(
        order,
        "Order cancelled by the customer",
        refunded
          ? `The customer cancelled this order and ${formatPrice(order.total)} was refunded through HitPay. Its items are back in stock.`
          : `The customer cancelled this order. HitPay couldn't refund this payment method, so please send ${formatPrice(order.total)} back to the customer, then use "Mark as refunded" on the order in the admin. Its items are back in stock.`,
      ),
      replyTo: order.customer.email,
    });
  }
  if (refunded) {
    await notifyRefunded(order);
  } else {
    await emailCustomer(
      order,
      `Your order ${reference} has been cancelled`,
      "Your order has been cancelled",
      `We've cancelled your order as requested. We'll refund ${formatPrice(order.total)} to you within 5 business days and let you know once it's done.`,
    );
  }
  return { refunded };
}

// Records a refund the shop made outside HitPay (e.g. sent back by GCash) and cancels the order.
export async function markRefundedManually(reference: string) {
  const order = await refundableOrder(reference);
  await recordRefund(reference, { amount: order.total, method: "manual" });
  console.info(`Manual refund recorded for order ${reference}`);
  await finishRefund(reference);
}
