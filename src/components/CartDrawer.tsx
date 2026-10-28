"use client";

import { useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { formatPrice } from "@/lib/money";
import { useCart } from "./CartProvider";

export function CartDrawer() {
  const { lines, subtotal, drawerOpen, setDrawerOpen, setQuantity } = useCart();

  useEffect(() => {
    if (!drawerOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setDrawerOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [drawerOpen, setDrawerOpen]);

  const close = () => setDrawerOpen(false);

  return (
    <div className={`drawer-root ${drawerOpen ? "open" : ""}`} aria-hidden={!drawerOpen}>
      <div className="drawer-overlay" onClick={close} />
      <aside className="drawer" role="dialog" aria-modal="true" aria-label="Your cart" inert={!drawerOpen}>
        <div className="drawer-head">
          <h2>Your cart</h2>
          <button type="button" className="icon-button" onClick={close} aria-label="Close cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
              <path d="M6 6l12 12M18 6 6 18" />
            </svg>
          </button>
        </div>
        {lines.length === 0 ? (
          <div className="drawer-empty">
            <p>Your cart is empty.</p>
            <Link href="/shop" className="button primary" onClick={close}>
              Shop chocolates
            </Link>
          </div>
        ) : (
          <>
            <ul className="drawer-lines">
              {lines.map((l) => (
                <li key={l.variantId}>
                  <div className="cart-thumb">{l.image && <Image src={l.image} alt="" fill sizes="72px" />}</div>
                  <div className="drawer-line-info">
                    <Link href={`/products/${l.handle}`} onClick={close}>
                      {l.title}
                    </Link>
                    {l.variantTitle && <span className="muted">{l.variantTitle}</span>}
                    <div className="qty small">
                      <button type="button" onClick={() => setQuantity(l.variantId, l.quantity - 1)} aria-label="Decrease">
                        −
                      </button>
                      <span>{l.quantity}</span>
                      <button type="button" onClick={() => setQuantity(l.variantId, l.quantity + 1)} aria-label="Increase">
                        +
                      </button>
                    </div>
                  </div>
                  <span className="drawer-line-total">{formatPrice(l.price * l.quantity)}</span>
                </li>
              ))}
            </ul>
            <div className="drawer-foot">
              <p className="drawer-subtotal">
                <span>Subtotal</span>
                <strong>{formatPrice(subtotal)}</strong>
              </p>
              <p className="muted small-print">Branch pickup or courier delivery, chosen at checkout.</p>
              <Link href="/checkout" className="button primary full" onClick={close}>
                Check out
              </Link>
              <button type="button" className="link-button" onClick={close}>
                Continue shopping
              </button>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}
