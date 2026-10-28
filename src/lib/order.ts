import { randomBytes } from "node:crypto";
import { findVariant } from "@/lib/catalog";
import { pickupBranches } from "@/lib/site";
import { escapeHtml } from "@/lib/email";
import { formatPrice } from "@/lib/money";

export type CheckoutRequest = {
  items: { variantId: string; quantity: number }[];
  customer: { name: string; email: string; phone: string };
  fulfillment: { method: "pickup"; branchId: string } | { method: "courier"; address: string };
  notes?: string;
};

export type OrderLine = { title: string; variant: string | null; quantity: number; unitPrice: number };

export type Order = {
  reference: string;
  lines: OrderLine[];
  total: number;
  customer: CheckoutRequest["customer"];
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
export function buildOrder(input: CheckoutRequest): Order {
  if (!Array.isArray(input.items) || input.items.length === 0) throw new OrderError("Your cart is empty.");
  const lines: OrderLine[] = input.items.map((item) => {
    const found = findVariant(String(item.variantId));
    const quantity = Math.floor(Number(item.quantity));
    if (!found || !found.variant.available) throw new OrderError("An item in your cart is no longer available.");
    if (!(quantity >= 1 && quantity <= MAX_QTY)) throw new OrderError("Please check the quantities in your cart.");
    return { title: found.product.title, variant: found.variant.title, quantity, unitPrice: found.variant.price };
  });

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
    lines,
    total: lines.reduce((sum, l) => sum + l.unitPrice * l.quantity, 0),
    customer,
    fulfillmentText,
    notes: typeof input.notes === "string" ? input.notes.trim().slice(0, 1000) : "",
  };
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

export function orderEmailHtml(order: Order, heading: string) {
  const rows = order.lines
    .map(
      (l) =>
        `<tr><td style="padding:4px 12px 4px 0">${l.quantity} ×</td><td style="padding:4px 12px 4px 0">${escapeHtml(lineLabel(l))}</td><td style="padding:4px 0;text-align:right">${formatPrice(l.unitPrice * l.quantity)}</td></tr>`,
    )
    .join("");
  return `<div style="font-family:Arial,sans-serif;font-size:14px;color:#222">
<h2 style="margin:0 0 12px">${escapeHtml(heading)}</h2>
<p><strong>Order:</strong> ${order.reference}</p>
<table style="border-collapse:collapse">${rows}
<tr><td></td><td style="padding:8px 12px 0 0"><strong>Total</strong></td><td style="padding:8px 0 0;text-align:right"><strong>${formatPrice(order.total)}</strong></td></tr></table>
<p><strong>Customer:</strong> ${escapeHtml(order.customer.name)}<br>${escapeHtml(order.customer.email)}<br>${escapeHtml(order.customer.phone)}</p>
<p><strong>Fulfillment:</strong> ${escapeHtml(order.fulfillmentText)}</p>
${order.notes ? `<p><strong>Notes:</strong> ${escapeHtml(order.notes)}</p>` : ""}
</div>`;
}
