import { randomBytes } from "node:crypto";
import { findVariant } from "@/lib/catalog";
import { db } from "@/lib/db";
import { pickupBranches } from "@/lib/site";
import { escapeHtml } from "@/lib/email";
import { formatPrice } from "@/lib/money";

export type CheckoutRequest = {
  items: { variantId: string; quantity: number }[];
  customer: { name: string; email: string; phone: string };
  fulfillment: { method: "pickup"; branchId: string } | { method: "courier"; address: string };
  notes?: string;
};

export type OrderLine = {
  variantId: string | null;
  title: string;
  variant: string | null;
  quantity: number;
  unitPrice: number;
};

export type OrderStatus = "pending" | "paid" | "ready" | "completed" | "cancelled";

export const orderStatuses: { value: OrderStatus; label: string }[] = [
  { value: "paid", label: "Paid – to prepare" },
  { value: "ready", label: "Ready / out for delivery" },
  { value: "completed", label: "Completed" },
  { value: "cancelled", label: "Cancelled" },
  { value: "pending", label: "Awaiting payment" },
];

export type Order = {
  reference: string;
  status: OrderStatus;
  createdAt: Date;
  paidAt: Date | null;
  lines: OrderLine[];
  total: number;
  customer: CheckoutRequest["customer"];
  fulfillmentMethod: "pickup" | "courier";
  fulfillmentText: string;
  notes: string;
};

const MAX_QTY = 99;

export class OrderError extends Error {}

function text(value: unknown, field: string, max = 200) {
  if (typeof value !== "string" || !value.trim()) throw new OrderError(`Please enter your ${field}.`);
  return value.trim().slice(0, max);
}

export function newReference() {
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  return `YC-${date}-${randomBytes(3).toString("hex").toUpperCase()}`;
}

// Builds the order from the catalog so prices can't be changed by the browser.
export async function buildOrder(input: CheckoutRequest): Promise<Order> {
  if (!Array.isArray(input.items) || input.items.length === 0) throw new OrderError("Your cart is empty.");
  const lines: OrderLine[] = await Promise.all(
    input.items.map(async (item) => {
      const found = await findVariant(String(item.variantId));
      const quantity = Math.floor(Number(item.quantity));
      if (!found || !found.variant.available) throw new OrderError("An item in your cart is no longer available.");
      if (!(quantity >= 1 && quantity <= MAX_QTY)) throw new OrderError("Please check the quantities in your cart.");
      const { product, variant } = found;
      if (variant.stock !== null && quantity > variant.stock) {
        const name = variant.title ? `${product.title} (${variant.title})` : product.title;
        throw new OrderError(`Only ${variant.stock} left of ${name}. Please update your cart.`);
      }
      return { variantId: variant.id, title: product.title, variant: variant.title, quantity, unitPrice: variant.price };
    }),
  );

  const customer = {
    name: text(input.customer?.name, "name", 100),
    email: text(input.customer?.email, "email", 200),
    phone: text(input.customer?.phone, "mobile number", 30),
  };
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(customer.email)) throw new OrderError("Please enter a valid email.");

  let fulfillmentText: string;
  const f = input.fulfillment;
  if (f?.method === "pickup") {
    const branch = pickupBranches.find((b) => b.id === f.branchId);
    if (!branch) throw new OrderError("Please choose a pickup branch.");
    fulfillmentText = `Pickup at ${branch.name}, ${branch.place}`;
  } else if (f?.method === "courier") {
    fulfillmentText = `Courier delivery (customer pays courier) to: ${text(f.address, "delivery address", 500)}`;
  } else {
    throw new OrderError("Please choose pickup or delivery.");
  }

  return {
    reference: newReference(),
    status: "pending",
    createdAt: new Date(),
    paidAt: null,
    lines,
    total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    customer,
    fulfillmentMethod: f.method,
    fulfillmentText,
    notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 1000) : "",
  };
}

export async function saveOrder(order: Order) {
  await db().begin(async (sql) => {
    await sql`insert into orders (reference, status, total, customer_name, customer_email, customer_phone,
        fulfillment_method, fulfillment_text, notes)
      values (${order.reference}, 'pending', ${order.total}, ${order.customer.name}, ${order.customer.email},
        ${order.customer.phone}, ${order.fulfillmentMethod}, ${order.fulfillmentText}, ${order.notes})`;
    for (const l of order.lines) {
      await sql`insert into order_items (order_reference, variant_id, product_title, variant_title, quantity, unit_price)
        values (${order.reference}, ${l.variantId}, ${l.title}, ${l.variant}, ${l.quantity}, ${l.unitPrice})`;
    }
  });
}

export async function setHitpayRequest(reference: string, requestId: string) {
  await db()`update orders set hitpay_request_id = ${requestId} where reference = ${reference}`;
}

type OrderRow = {
  reference: string;
  status: OrderStatus;
  created_at: Date;
  paid_at: Date | null;
  total: number;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  fulfillment_method: "pickup" | "courier";
  fulfillment_text: string;
  notes: string;
};
type ItemRow = {
  order_reference: string;
  variant_id: string | null;
  product_title: string;
  variant_title: string | null;
  quantity: number;
  unit_price: number;
};

function toOrder(row: OrderRow, items: ItemRow[]): Order {
  return {
    reference: row.reference,
    status: row.status,
    createdAt: row.created_at,
    paidAt: row.paid_at,
    total: row.total,
    customer: { name: row.customer_name, email: row.customer_email, phone: row.customer_phone },
    fulfillmentMethod: row.fulfillment_method,
    fulfillmentText: row.fulfillment_text,
    notes: row.notes,
    lines: items
      .filter((i) => i.order_reference === row.reference)
      .map((i) => ({
        variantId: i.variant_id,
        title: i.product_title,
        variant: i.variant_title,
        quantity: i.quantity,
        unitPrice: i.unit_price,
      })),
  };
}

export async function getOrder(reference: string) {
  const sql = db();
  const [row] = await sql<OrderRow[]>`select * from orders where reference = ${reference}`;
  if (!row) return undefined;
  const items = await sql<ItemRow[]>`select * from order_items where order_reference = ${reference} order by id`;
  return toOrder(row, items);
}

export async function listOrders(status: OrderStatus | "all", limit = 200) {
  const sql = db();
  const rows = await sql<OrderRow[]>`select * from orders
    where ${status === "all"} or status = ${status}
    order by created_at desc limit ${limit}`;
  const refs = rows.map((r) => r.reference);
  const items = refs.length
    ? await sql<ItemRow[]>`select * from order_items where order_reference = any(${refs}) order by id`
    : [];
  return rows.map((r) => toOrder(r, items));
}

export async function countOrdersByStatus() {
  const rows = await db()<{ status: OrderStatus; count: number }[]>`
    select status, count(*)::int as count from orders group by status`;
  return Object.fromEntries(rows.map((r) => [r.status, r.count])) as Partial<Record<OrderStatus, number>>;
}

export async function updateOrderStatus(reference: string, status: OrderStatus) {
  await db()`update orders set status = ${status} where reference = ${reference}`;
}

// Marks an order paid exactly once and takes the items out of stock.
// Returns the order only the first time, so repeated webhooks don't double-count.
export async function markOrderPaid(opts: { reference: string; requestId: string; paymentId: string; amount: string }) {
  const sql = db();
  const updated = await sql.begin(async (tx) => {
    const [row] = await tx<OrderRow[]>`select * from orders
      where (reference = ${opts.reference} or hitpay_request_id = ${opts.requestId}) and status = 'pending'
      for update`;
    if (!row) return null;
    if (Math.round(Number(opts.amount) * 100) !== row.total) {
      throw new Error(`Paid amount ${opts.amount} does not match order ${row.reference} total ${row.total}`);
    }
    await tx`update orders set status = 'paid', paid_at = now(), hitpay_payment_id = ${opts.paymentId}
      where reference = ${row.reference}`;
    const items = await tx<ItemRow[]>`select * from order_items where order_reference = ${row.reference}`;
    for (const item of items) {
      if (!item.variant_id) continue;
      await tx`update variants set stock = greatest(stock - ${item.quantity}, 0)
        where id = ${item.variant_id} and stock is not null`;
    }
    return row.reference;
  });
  return updated ? getOrder(updated) : undefined;
}

export function lineLabel(line: OrderLine) {
  return line.variant ? `${line.title} (${line.variant})` : line.title;
}

// Short summary shown in the HitPay dashboard and receipt.
export function orderPurpose(order: Order) {
  const items = order.lines.map((l) => `${l.quantity}x ${lineLabel(l)}`).join(", ");
  const purpose = `${order.reference}: ${items}`;
  return purpose.length > 250 ? purpose.slice(0, 247) + "..." : purpose;
}

export function orderEmailHtml(order: Order, heading: string, intro = "") {
  const rows = order.lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 12px 4px 0">${l.quantity} ×</td><td style="padding:4px 12px 4px 0">${escapeHtml(lineLabel(l))}</td><td style="padding:4px 0;text-align:right">${formatPrice(l.unitPrice * l.quantity)}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
<h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>
${intro ? `<p>${intro}</p>` : ""}
<p><strong>Order:</strong> ${order.reference}</p>
<table style="border-collapse:collapse">${rows}
<tr><td></td><td style="padding:8px 12px 0 0"><strong>Total</strong></td><td style="padding:8px 0 0;text-align:right"><strong>${formatPrice(order.total)}</strong></td></tr></table>
<p><strong>Customer:</strong> ${escapeHtml(order.customer.name)}<br>${escapeHtml(order.customer.email)}<br>${escapeHtml(order.customer.phone)}</p>
<p><strong>Fulfillment:</strong> ${escapeHtml(order.fulfillmentText)}</p>
${order.notes ? `<p><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ""}
</div>`;
}
