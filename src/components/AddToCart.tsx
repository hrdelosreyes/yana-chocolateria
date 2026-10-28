"use client";

import { useState } from "react";
import type { Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { useCart } from "./CartProvider";

export function AddToCart({ product }: { product: Product }) {
  const { add } = useCart();
  const firstAvailable = product.variants.find((v) => v.available) ?? product.variants[0];
  const [variantId, setVariantId] = useState(firstAvailable.id);
  const [quantity, setQuantity] = useState(1);
  const variant = product.variants.find((v) => v.id === variantId)!;

  function handleAdd() {
    add(
      {
        variantId: variant.id,
        handle: product.handle,
        title: product.title,
        variantTitle: variant.title,
        price: variant.price,
        image: product.images[0] ?? null,
      },
      quantity,
    );
  }

  return (
    <div className="add-to-cart">
      <p className="price large">{formatPrice(variant.price)}</p>
      {product.variants.length > 1 && (
        <fieldset className="variant-picker">
          <legend>{product.optionName ?? "Option"}</legend>
          {product.variants.map((v) => (
            <label key={v.id} className={v.id === variantId ? "selected" : undefined}>
              <input
                type="radio"
                name="variant"
                value={v.id}
                checked={v.id === variantId}
                disabled={!v.available}
                onChange={() => {
                  setVariantId(v.id);
                }}
              />
              {v.title}
            </label>
          ))}
        </fieldset>
      )}
      <div className="qty-row">
        <label htmlFor="qty">Quantity</label>
        <div className="qty">
          <button type="button" onClick={() => setQuantity((q) => Math.max(1, q - 1))} aria-label="Decrease quantity">
            −
          </button>
          <input
            id="qty"
            type="number"
            min={1}
            max={99}
            value={quantity}
            onChange={(e) => setQuantity(Math.max(1, Math.min(99, Number(e.target.value) || 1)))}
          />
          <button type="button" onClick={() => setQuantity((q) => Math.min(99, q + 1))} aria-label="Increase quantity">
            +
          </button>
        </div>
      </div>
      <button className="button primary full large" onClick={handleAdd} disabled={!variant.available}>
        {variant.available ? `Add to cart · ${formatPrice(variant.price * quantity)}` : "Sold out"}
      </button>
    </div>
  );
}
