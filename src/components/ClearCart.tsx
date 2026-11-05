"use client";

import { useEffect } from "react";
import { useCart } from "./CartProvider";

// Empties the cart after a successful payment and asks the server to confirm the
// payment with HitPay, in case the webhook hasn't arrived.
export function ClearCart({ reference }: { reference?: string }) {
  const { clear, ready } = useCart();
  useEffect(() => {
    if (ready) clear();
  }, [ready, clear]);
  useEffect(() => {
    if (!reference) return;
    fetch("/api/hitpay/sync", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ reference }),
    }).catch(() => {});
  }, [reference]);
  return null;
}
