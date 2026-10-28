"use client";

import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/money";
import { useCart } from "./CartProvider";

export function CartView() {
  const { lines, subtotal, ready, setQuantity } = useCart();
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
  return (
    <div>
      <ul className="cart-lines">
        {lines.map((l) => (
          <li key={l.variantId}>
            <div className="cart-thumb">{l.image && <Image src={l.image} alt="" fill sizes="80px" />}</div>
            <div className="cart-info">
              <Link href={`/products/${l.handle}`}>{l.title}</Link>
              {l.variantTitle && <span className="muted">{l.variantTitle}</span>}
              <span>{formatPrice(l.price)}</span>
            </div>
            <div className="qty small">
              <button type="button" onClick={() => setQuantity(l.variantId, l.quantity - 1)} aria-label="Decrease">
                −
              </button>
              <span>{l.quantity}</span>
              <button type="button" onClick={() => setQuantity(l.variantId, l.quantity + 1)} aria-label="Increase">
                +
              </button>
            </div>
            <div className="cart-line-total">{formatPrice(l.price * l.quantity)}</div>
          </li>
        ))}
      </ul>
      <div className="cart-summary">
        <p>
          Subtotal <strong>{formatPrice(subtotal)}</strong>
        </p>
        <p className="muted">Pick up at one of our branches, or have it delivered by courier (courier fee paid separately).</p>
        <Link href="/checkout" className="button primary">
          Check out
        </Link>
      </div>
    </div>
  );
}
