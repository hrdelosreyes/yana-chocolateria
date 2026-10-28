import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { getCollections, getProducts } from "@/lib/catalog";
import { navCollections } from "@/lib/site";

export const metadata: Metadata = { title: "Shop" };

export default async function Shop() {
  const [products, collections] = await Promise.all([getProducts(), getCollections()]);
  return (
    <div className="section container">
      <h1 className="page-title">Shop</h1>
      <nav className="chips">
        <Link href="/shop" className="chip active">
          All
        </Link>
        {navCollections.map((h) => (
          <Link key={h} href={`/collections/${h}`} className="chip">
            {collections.find((c) => c.handle === h)?.title}
          </Link>
        ))}
      </nav>
      <ProductGrid products={products} />
    </div>
  );
}
