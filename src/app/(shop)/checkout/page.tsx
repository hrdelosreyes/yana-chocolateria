import type { Metadata } from "next";
import { CheckoutForm } from "@/components/CheckoutForm";

export const metadata: Metadata = { title: "Checkout", robots: { index: false } };

export default function CheckoutPage() {
  return (
    <div className="section container">
      <h1 className="page-title">Checkout</h1>
      <CheckoutForm />
    </div>
  );
}
