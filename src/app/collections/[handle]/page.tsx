import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { collections, getCollection, productsInCollection } from "@/lib/catalog";
import { navCollections } from "@/lib/site";

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return collections.map((c) => ({ handle: c.handle }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const collection = getCollection((await params).handle);
  return { title: collection?.title, description: collection?.description || undefined };
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  const collection = getCollection(handle);
  if (!collection) notFound();
  return (
    <div className="section container">
      <h1 className="page-title">{collection.title}</h1>
      {collection.description && <p className="lead center">{collection.description}</p>}
      <nav className="chips">
        <Link href="/shop" className="chip">
          All
        </Link>
        {navCollections.map((h) => (
          <Link key={h} href={`/collections/${h}`} className={`chip ${h === handle ? "active" : ""}`}>
            {getCollection(h)?.title}
          </Link>
        ))}
      </nav>
      <ProductGrid products={productsInCollection(handle)} />
    </div>
  );
}
