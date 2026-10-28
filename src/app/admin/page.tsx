import Link from "next/link";
import { requireAdmin } from "@/lib/admin-auth";
import { formatDate } from "@/lib/dates";
import { formatPrice } from "@/lib/money";
import { countOrdersByStatus, lineLabel, listOrders, orderStatuses, type OrderStatus } from "@/lib/order";

type Props = { searchParams: Promise<{ status?: string }> };

export default async function OrdersPage({ searchParams }: Props) {
  await requireAdmin();
  const requested = (await searchParams).status;
  const status: OrderStatus | "all" =
    requested === "all" || orderStatuses.some((s) => s.value === requested) ? (requested as OrderStatus | "all") : "paid";
  const [orders, counts] = await Promise.all([listOrders(status), countOrdersByStatus()]);

  return (
    <>
      <h1>Orders</h1>
      <nav className="chips admin-tabs">
        {orderStatuses.map((s) => (
          <Link key={s.value} href={`/admin?status=${s.value}`} className={`chip ${s.value === status ? "active" : ""}`}>
            {s.label} ({counts[s.value] ?? 0})
          </Link>
        ))}
        <Link href="/admin?status=all" className={`chip ${status === "all" ? "active" : ""}`}>
          All
        </Link>
      </nav>
      {orders.length === 0 ? (
        <p className="muted">No orders here.</p>
      ) : (
        <ul className="admin-list">
          {orders.map((o) => (
            <li key={o.reference}>
              <Link href={`/admin/orders/${o.reference}`}>
                <div className="admin-row-top">
                  <strong>{o.customer.name}</strong>
                  <strong>{formatPrice(o.total)}</strong>
                </div>
                <div className="muted">
                  {o.reference} · {formatDate(o.paidAt ?? o.createdAt)}
                  {status === "all" && ` · ${orderStatuses.find((s) => s.value === o.status)?.label}`}
                </div>
                <div>{o.lines.map((l) => `${l.quantity}× ${lineLabel(l)}`).join(", ")}</div>
                <div className="muted">{o.fulfillmentText}</div>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
