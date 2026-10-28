import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ProductGrid } from "@/components/ProductCard";
import { getCollections, productsInCollection } from "@/lib/catalog";
import { navCollections } from "@/lib/site";

type Props = { params: Promise<{ handle: string }> };

export async function generateStaticParams() {
  return (await getCollections()).map((c) => ({ handle: c.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const handle = (await params).handle;
  const collection = (await getCollections()).find((c) => c.handle === handle);
  return { title: collection?.title, description: collection?.description || undefined };
}

export default async function CollectionPage({ params }: Props) {
  const { handle } = await params;
  const collections = await getCollections();
  const collection = collections.find((c) => c.handle === handle);
  if (!collection) notFound();
  const products = await productsInCollection(handle);
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
            {collections.find((c) => c.handle === h)?.title}
          </Link>
        ))}
      </nav>
      <ProductGrid products={products} />
    </div>
  );
}
