"use client";

import { useActionState } from "react";
import type { Collection, Product } from "@/lib/catalog";
import { saveProductAction } from "../../actions";

export function ProductForm({ product, collections }: { product: Product; collections: Collection[] }) {
  const [state, action, pending] = useActionState(saveProductAction, null);
  return (
    <form action={action} className="admin-form">
      <input type="hidden" name="handle" value={product.handle} />

      <section className="admin-card">
        <label>
          Name
          <input name="title" defaultValue={product.title} required />
        </label>
        <label className="check">
          <input type="checkbox" name="published" defaultChecked={product.published} />
          Show on website
        </label>
      </section>

      <section className="admin-card">
        <h2>{product.variants.length > 1 ? "Options, prices and stock" : "Price and stock"}</h2>
        <p className="muted">Leave stock blank if you don&apos;t want to track it. At 0 the item shows as sold out.</p>
        {product.variants.map((v) => (
          <fieldset key={v.id} className="variant-edit">
            <input type="hidden" name="variantId" value={v.id} />
            {product.variants.length > 1 && (
              <label>
                Option name
                <input name={`title.${v.id}`} defaultValue={v.title ?? ""} />
              </label>
            )}
            {product.variants.length === 1 && <input type="hidden" name={`title.${v.id}`} value={v.title ?? ""} />}
            <div className="variant-edit-row">
              <label>
                Price (₱)
                <input name={`price.${v.id}`} defaultValue={(v.price / 100).toFixed(2)} inputMode="decimal" required />
              </label>
              <label>
                Stock
                <input
                  name={`stock.${v.id}`}
                  defaultValue={v.stock ?? ""}
                  inputMode="numeric"
                  placeholder="Not tracked"
                />
              </label>
            </div>
            <label className="check">
              <input type="checkbox" name={`available.${v.id}`} defaultChecked={v.available} />
              Available to order
            </label>
          </fieldset>
        ))}
      </section>

      <section className="admin-card">
        <h2>Categories</h2>
        {collections.map((c) => (
          <label key={c.handle} className="check">
            <input
              type="checkbox"
              name="collections"
              value={c.handle}
              defaultChecked={product.collections.includes(c.handle)}
            />
            {c.title}
          </label>
        ))}
      </section>

      <section className="admin-card">
        <h2>Description</h2>
        <p className="muted">HTML is allowed, e.g. &lt;p&gt;, &lt;strong&gt;, &lt;ul&gt;&lt;li&gt;.</p>
        <textarea name="description" defaultValue={product.descriptionHtml} rows={12} />
      </section>

      {state?.error && <p className="error">{state.error}</p>}
      <div className="admin-save">
        <button className="button primary full" disabled={pending}>
          {pending ? "Saving…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
