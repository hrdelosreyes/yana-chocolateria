"use client";

import Link from "next/link";
import type { Product } from "@/lib/catalog";
import { useCart } from "./CartProvider";

export function QuickAdd({ product }: { product: Product }) {
  const { add } = useCart();
  if (product.variants.length > 1) {
    return (
      <Link href={`/products/${product.handle}`} className="quick-add">
        Choose options
      </Link>
    );
  }
  const v = product.variants[0];
  return (
    <button
      type="button"
      className="quick-add"
      onClick={() =>
        add(
          { variantId: v.id, handle: product.handle, title: product.title, variantTitle: v.title, price: v.price, image: product.images[0] ?? null },
          1,
        )
      }
    >
      Add to cart
    </button>
  );
}
