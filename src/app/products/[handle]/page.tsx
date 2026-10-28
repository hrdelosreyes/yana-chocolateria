import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { AddToCart } from "@/components/AddToCart";
import { Gallery } from "@/components/Gallery";
import { getProduct, products } from "@/lib/catalog";

type Props = { params: Promise<{ handle: string }> };

export function generateStaticParams() {
  return products.map((p) => ({ handle: p.handle }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const product = getProduct((await params).handle);
  if (!product) return {};
  const description = product.descriptionHtml.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 160);
  return { title: product.title, description, openGraph: { images: product.images.slice(0, 1) } };
}

export default async function ProductPage({ params }: Props) {
  const product = getProduct((await params).handle);
  if (!product) notFound();
  return (
    <div className="section container product-page">
      <Gallery images={product.images} title={product.title} />
      <div>
        <h1 className="product-title">{product.title}</h1>
        <AddToCart product={product} />
        {/* Descriptions come from the shop's own product data. */}
        <div className="rte" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
      </div>
    </div>
  );
}
