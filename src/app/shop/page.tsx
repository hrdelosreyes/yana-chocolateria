import type { Metadata } from "next";
import Link from "next/link";
import { ProductGrid } from "@/components/ProductCard";
import { getCollection, products } from "@/lib/catalog";
import { navCollections } from "@/lib/site";

export const metadata: Metadata = { title: "Shop" };

export default function Shop() {
  return (
    <div className="section container">
      <h1 className="page-title">Shop</h1>
      <nav className="chips">
        <Link href="/shop" className="chip active">
          All
        </Link>
        {navCollections.map((h) => (
          <Link key={h} href={`/collections/${h}`} className="chip">
            {getCollection(h)?.title}
          </Link>
        ))}
      </nav>
      <ProductGrid products={products} />
    </div>
  );
}
