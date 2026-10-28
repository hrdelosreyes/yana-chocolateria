import type { Metadata } from "next";
import { CartView } from "@/components/CartView";

export const metadata: Metadata = { title: "Cart" };

export default function CartPage() {
  return (
    <div className="section container narrow">
      <h1 className="page-title">Your cart</h1>
      <CartView />
    </div>
  );
}
