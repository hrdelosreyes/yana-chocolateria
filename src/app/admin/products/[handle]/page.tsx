import Link from "next/link";
import { notFound } from "next/navigation";
import { requireAdmin } from "@/lib/admin-auth";
import { getAllProductsForAdmin, getCollections } from "@/lib/catalog";
import { db } from "@/lib/db";
import { ProductForm } from "./ProductForm";

type Props = { params: Promise<{ handle: string }>; searchParams: Promise<{ saved?: string }> };

export default async function EditProductPage({ params, searchParams }: Props) {
  await requireAdmin();
  const { handle } = await params;
  const [products, collections] = await Promise.all([getAllProductsForAdmin(), getCollections()]);
  const product = products.find((p) => p.handle === handle);
  if (!product) notFound();
  // The catalog marks variants sold out when stock hits 0; the form needs the manual on/off switch.
  const manual = await db()<{ id: string; available: boolean }[]>`
    select id, available from variants where product_handle = ${handle}`;
  const variants = product.variants.map((v) => ({
    ...v,
    available: manual.find((m) => m.id === v.id)?.available ?? v.available,
  }));

  return (
    <>
      <p>
        <Link href="/admin/products">← All products</Link>
      </p>
      <h1>{product.title}</h1>
      {(await searchParams).saved && (
        <p className="notice">
          Saved. <Link href={`/products/${handle}`} target="_blank">View on site</Link>
        </p>
      )}
      <ProductForm product={{ ...product, variants }} collections={collections} />
    </>
  );
}
