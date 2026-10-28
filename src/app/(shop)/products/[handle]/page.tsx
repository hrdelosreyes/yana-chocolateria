import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { Gallery } from "@/components/Gallery";
import { getCollection, getProduct, getProducts } from "@/lib/catalog";
import { ProductGrid } from "@/components/ProductCard";

type Props = { params: Promise<{ handle: string }> };

export async function generateStaticParams() {
  return (await getProducts()).map((p) => ({ handle: p.handle }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = await getProduct((await params).handle);
  if (!product) return {};
  const description = product.descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  return { title: product.title, description, openGraph: { images: product.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).handle);
  if (!product) notFound();
  const collection = product.collections[0] ? await getCollection(product.collections[0]) : undefined;
  const related = (await getProducts())
    .filter((p) => p.handle !== product.handle && p.collections.some((c) => product.collections.includes(c)))
    .slice(0, 4);
  return (
    <>
      <div className="section container product-page">
        <Gallery images={product.images} title={product.title} />
        <div className="product-info">
          <nav className="breadcrumbs" aria-label="Breadcrumb">
            <Link href="/shop">Shop</Link>
            {collection && (
              <>
                <span aria-hidden>/</span>
                <Link href={`/collections/${collection.handle}`}>{collection.title}</Link>
              </>
            )}
          </nav>
          <h1 className="product-title">{product.title}</h1>
          <AddToCart product={product} />
          <ul className="perks">
            <li>Made with single-origin Philippine cacao</li>
            <li>Pick up at either of our 2 branches, or courier delivery</li>
            <li>Secure payment with GCash, Maya, QR Ph or card</li>
          </ul>
          {/* Descriptions come from the shop's own product data. */}
          <div className="rte" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
        </div>
      </div>
      {related.length > 0 && (
        <section className="section container related">
          <h2 className="display-title">You may also like</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </>
  );
}
