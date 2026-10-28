"use client";

import { useCart } from "./CartProvider";

export function CartButton() {
  const { count, setDrawerOpen } = useCart();
  return (
    <button type="button" className="cart-button" onClick={() => setDrawerOpen(true)} aria-label={`Cart, ${count} items`}>
      <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
        <path d="M5 7h14l-1.2 12.1a1 1 0 0 1-1 .9H7.2a1 1 0 0 1-1-.9L5 7Z" />
        <path d="M9 7V6a3 3 0 0 1 6 0v1" />
      </svg>
      {count > 0 && (
        <span key={count} className="cart-count">
          {count}
        </span>
      )}
    </button>
  );
}
