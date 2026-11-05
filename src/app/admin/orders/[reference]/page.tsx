import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate } from "@/lib/dates";
import { formatPrice } from "@/lib/money";
import { getOrder, lineLabel, orderStatuses } from "@/lib/order";
import { checkPaymentAction, setOrderStatusAction } from "../../actions";
import { ManualRefundForm } from "./ManualRefundForm";
import { RefundForm } from "./RefundForm";

type Props = { params: Promise<{ reference: string }>; searchParams: Promise<{ saved?: string; checked?: string }> };

export default async function OrderPage({ params, searchParams }: Props) {
  await requireAdmin();
  const order = await getOrder((await params).reference);
  if (!order) notFound();
  const { saved, checked } = await searchParams;
  const phoneHref = `tel:${order.customer.phone.replace(/[^\d+]/g, "")}`;

  return (
    <>
      <p>
        <Link href="/admin">← All orders</Link>
      </p>
      <h1>Order {order.reference}</h1>
      {saved && <p className="notice">Status updated.</p>}
      {order.refundedAt && (
        <p className="notice">
          Refunded {formatPrice(order.refundAmount ?? order.total)}
          {order.refundMethod === "manual" ? " outside HitPay" : " through HitPay"} on {formatDate(order.refundedAt)}.
          The order is cancelled.
        </p>
      )}
      {checked === "paid" && <p className="notice">HitPay confirmed the payment. The order is now marked paid.</p>}
      {checked === "unpaid" && <p className="error">HitPay hasn&apos;t received a payment for this order.</p>}
      {checked === "error" && <p className="error">Couldn&apos;t reach HitPay. Please try again in a moment.</p>}
      {order.status === "pending" && (
        <form action={checkPaymentAction} className="admin-card">
          <input type="hidden" name="reference" value={order.reference} />
          <p>If the customer has paid but this order still says Awaiting payment, check it with HitPay.</p>
          <button className="button primary">Check payment with HitPay</button>
        </form>
      )}
      <p className="muted">
        Placed {formatDate(order.createdAt)}
        {order.paidAt && ` · Paid ${formatDate(order.paidAt)}`}
      </p>

      <section className="admin-card">
        <h2>Status</h2>
        <form action={setOrderStatusAction} className="status-buttons">
          <input type="hidden" name="reference" value={order.reference} />
          {orderStatuses.map((s) => (
            <button
              key={s.value}
              name="status"
              value={s.value}
              className={`button ${s.value === order.status ? "primary" : ""}`}
              disabled={s.value === order.status}
            >
              {s.label}
            </button>
          ))}
        </form>
      </section>

      <section className="admin-card">
        <h2>Items</h2>
        <table className="admin-table">
          <tbody>
            {order.lines.map((l, i) => (
              <tr key={i}>
                <td>{l.quantity}×</td>
                <td>{lineLabel(l)}</td>
                <td className="num">{formatPrice(l.unitPrice * l.quantity)}</td>
              </tr>
            ))}
            <tr>
              <td />
              <td>
                <strong>Total</strong>
              </td>
              <td className="num">
                <strong>{formatPrice(order.total)}</strong>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      {order.paidAt && !order.refundedAt && (
        <section className="admin-card">
          <h2>Refund</h2>
          <RefundForm reference={order.reference} amount={formatPrice(order.total)} />
          <ManualRefundForm reference={order.reference} amount={formatPrice(order.total)} />
        </section>
      )}

      <section className="admin-card">
        <h2>Customer</h2>
        <p>
          {order.customer.name}
          <br />
          <a href={`mailto:${order.customer.email}`}>{order.customer.email}</a>
          <br />
          <a href={phoneHref}>{order.customer.phone}</a>
        </p>
        <h2>{order.fulfillmentMethod === "pickup" ? "Pickup" : "Delivery"}</h2>
        <p>{order.fulfillmentText}</p>
        {order.notes && (
          <>
            <h2>Notes</h2>
            <p>{order.notes}</p>
          </>
        )}
      </section>
    </>
  );
}
