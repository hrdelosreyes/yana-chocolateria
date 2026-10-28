"use client";

import { useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/money";
import { pickupBranches } from "@/lib/site";
import { useCart } from "./CartProvider";

export function CheckoutForm() {
  const { lines, subtotal, ready } = useCart();
  const [method, setMethod] = useState<"pickup" | "courier">("pickup");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  if (!ready) return null;
  if (lines.length === 0) {
    return (
      <div className="empty">
        <p>Your cart is empty.</p>
        <Link href="/shop" className="button primary">
          Continue shopping
        </Link>
      </div>
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    const form = new FormData(e.currentTarget);
    const get = (k: string) => String(form.get(k) ?? "");
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
          customer: { name: get("name"), email: get("email"), phone: get("phone") },
          fulfillment:
            method === "pickup" ? { method, branchId: get("branch") } : { method, address: get("address") },
          notes: get("notes"),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.url) throw new Error(data.error || "Something went wrong. Please try again.");
      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <div className="checkout">
      <form onSubmit={handleSubmit} className="checkout-form">
        <h2>Contact</h2>
        <label>
          Full name
          <input name="name" required autoComplete="name" maxLength={100} />
        </label>
        <label>
          Email
          <input name="email" type="email" required autoComplete="email" maxLength={200} />
        </label>
        <label>
          Mobile number
          <input name="phone" type="tel" required autoComplete="tel" placeholder="09XX XXX XXXX" maxLength={30} />
        </label>

        <h2>Pickup or delivery</h2>
        <div className="choice">
          <label className={method === "pickup" ? "selected" : undefined}>
            <input type="radio" name="method" checked={method === "pickup"} onChange={() => setMethod("pickup")} />
            Pick up at a branch
          </label>
          <label className={method === "courier" ? "selected" : undefined}>
            <input type="radio" name="method" checked={method === "courier"} onChange={() => setMethod("courier")} />
            Courier delivery
          </label>
        </div>
        {method === "pickup" ? (
          <label>
            Branch
            <select name="branch" required defaultValue="">
              <option value="" disabled>
                Choose a branch
              </option>
              {pickupBranches.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.name} – {b.place}
                </option>
              ))}
            </select>
          </label>
        ) : (
          <>
            <label>
              Delivery address
              <textarea name="address" required rows={3} maxLength={500} autoComplete="street-address" />
            </label>
            <p className="muted">
              We&apos;ll book Lalamove or Grab once your order is ready. The courier fee is paid separately to the
              courier.
            </p>
          </>
        )}
        <label>
          Order notes (optional)
          <textarea name="notes" rows={2} maxLength={1000} />
        </label>
        {error && (
          <p className="error" role="alert">
            {error}
          </p>
        )}
        <button className="button primary full" disabled={submitting}>
          {submitting ? "Redirecting to payment…" : `Pay ${formatPrice(subtotal)}`}
        </button>
        <p className="muted small-print">
          You&apos;ll pay securely with HitPay: GCash, Maya, QR Ph, cards and more.
        </p>
      </form>

      <aside className="order-summary">
        <h2>Your order</h2>
        <ul>
          {lines.map((l) => (
            <li key={l.variantId}>
              <span>
                {l.quantity} × {l.title}
                {l.variantTitle && <span className="muted"> ({l.variantTitle})</span>}
              </span>
              <span>{formatPrice(l.price * l.quantity)}</span>
            </li>
          ))}
        </ul>
        <p className="total">
          <span>Total</span>
          <strong>{formatPrice(subtotal)}</strong>
        </p>
        <Link href="/cart">Edit cart</Link>
      </aside>
    </div>
  );
}
