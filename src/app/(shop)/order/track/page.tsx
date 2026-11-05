import type { Metadata } from "next";
import Link from "next/link";
import { hasDatabase } from "@/lib/db";
import { formatDate } from "@/lib/dates";
import { formatPrice } from "@/lib/money";
import { getOrder, lineLabel, type Order } from "@/lib/order";
import { verifyOrderToken } from "@/lib/order-links";
import { site } from "@/lib/site";
import { CancelForm } from "./CancelForm";
import { TrackForm } from "./TrackForm";

export const metadata: Metadata = { title: "Track your order", robots: { index: false } };

type Props = { searchParams: Promise<{ ref?: string; t?: string }> };

function steps(order: Order) {
  const pickup = order.fulfillmentMethod === "pickup";
  const reached = { pending: -1, paid: 0, ready: 1, completed: 2, cancelled: -1 }[order.status];
  return [
    "Payment received",
    pickup ? "Ready for pickup" : "Out for delivery",
    pickup ? "Picked up" : "Delivered",
  ].map((label, i) => ({ label, done: i <= reached, current: i === reached }));
}

function statusMessage(order: Order) {
  switch (order.status) {
    case "pending":
      return "We haven't received payment for this order yet.";
    case "paid":
      return "We've received your payment. Your order is in line to be prepared.";
    case "ready":
      return order.fulfillmentMethod === "pickup"
        ? `Your order is ready. ${order.fulfillmentText.replace(/^Pickup at /, "Pick it up at ")}, and bring your order number.`
        : "Your order is on its way with the courier.";
    case "completed":
      return order.fulfillmentMethod === "pickup" ? "Your order has been picked up. Enjoy!" : "Your order has been delivered. Enjoy!";
    case "cancelled":
      if (order.refundedAt) {
        return `This order was cancelled and ${formatPrice(order.refundAmount ?? order.total)} was refunded on ${formatDate(order.refundedAt)}.`;
      }
      return order.paidAt
        ? `This order was cancelled. Your refund of ${formatPrice(order.total)} is being processed, and we'll let you know once it's done.`
        : "This order was cancelled.";
  }
}

export default async function TrackOrder({ searchParams }: Props) {
  const { ref, t } = await searchParams;
  const reference = ref?.trim().toUpperCase();
  const order =
    hasDatabase && reference && t && verifyOrderToken(reference, t) ? await getOrder(reference) : undefined;

  if (!order) {
    return (
      <div className="section container narrow">
        <h1 className="page-title">Track your order</h1>
        <p className="lead center">Enter your order number and the email or mobile number you used at checkout.</p>
        <TrackForm reference={reference} />
      </div>
    );
  }

  const showSteps = order.status !== "cancelled" && order.status !== "pending";
  return (
    <div className="section container narrow">
      <p className="eyebrow center">Order {order.reference}</p>
      <h1 className="page-title">{order.status === "cancelled" ? "Order cancelled" : "Your order"}</h1>
      <p className="lead center">{statusMessage(order)}</p>

      {showSteps && (
        <ol className="order-steps">
          {steps(order).map((s) => (
            <li key={s.label} className={s.done ? "done" : s.current ? "current" : undefined}>
              <span className="order-step-dot" aria-hidden />
              {s.label}
            </li>
          ))}
        </ol>
      )}

      <div className="order-summary track-summary">
        <h2>Details</h2>
        <ul>
          {order.lines.map((l, i) => (
            <li key={i}>
              <span>
                {l.quantity} × {lineLabel(l)}
              </span>
              <span>{formatPrice(l.unitPrice * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="total">
          <span>Total</span>
          <strong>{formatPrice(order.total)}</strong>
        </p>
        <p className="muted">
          Placed {formatDate(order.createdAt)}
          <br />
          {order.fulfillmentText}
        </p>
      </div>

      {order.status === "paid" && (
        <CancelForm reference={order.reference} token={t!} amount={formatPrice(order.total)} />
      )}

      <p className="center muted">
        Questions? Email <a href={`mailto:${site.email}`}>{site.email}</a> or call <a href={site.phoneHref}>{site.phone}</a>
        .
      </p>
      <p className="center">
        <Link href="/shop" className="button">
          Continue shopping
        </Link>
      </p>
    </div>
  );
}
