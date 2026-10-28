import Link from "next/link";
import Image from "next/image";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllProductsForAdmin } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";

export default async function ProductsPage() {
  await requireAdmin();
  const products = await getAllProductsForAdmin();
  return (
    <>
      <h1>Products</h1>
      <ul className="admin-list">
        {products.map((p) => (
          <li key={p.handle}>
            <Link href={`/admin/products/${p.handle}`} className="admin-product-row">
              <div className="admin-thumb">{p.images[0] && <Image src={p.images[0]} alt="" fill sizes="56px" />}</div>
              <div>
                <div className="admin-row-top">
                  <strong>{p.title}</strong>
                  {!p.published && <span className="badge-inline">Hidden</span>}
                </div>
                <div className="muted">
                  {p.variants
                    .map(
                      (v) =>
                        `${v.title ? `${v.title}: ` : ""}${formatPrice(v.price)}${
                          v.stock !== null ? ` (${v.stock} in stock)` : ""
                        }${v.available ? "" : " – sold out"}`,
                    )
                    .join(" · ")}
                </div>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
