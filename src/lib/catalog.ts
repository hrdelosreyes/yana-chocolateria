import { cache } from "react";
import productsData from "@/data/products.json";
import collectionsData from "@/data/collections.json";
import { db, hasDatabase } from "@/lib/db";

// stock: null means stock isn't tracked for that variant.
export type Variant = { id: string; title: string | null; price: number; available: boolean; stock: number | null };
export type Product = {
  handle: string;
  title: string;
  descriptionHtml: string;
  optionName: string | null;
  images: string[];
  collections: string[];
  published: boolean;
  variants: Variant[];
};
export type Collection = { handle: string; title: string; description: string; image: string | null };

type ProductRow = {
  handle: string;
  title: string;
  description_html: string;
  option_name: string | null;
  images: string[];
  collections: string[];
  published: boolean;
};
type VariantRow = {
  id: string;
  product_handle: string;
  title: string | null;
  price: number;
  available: boolean;
  stock: number | null;
};

// Used until a database is connected; the database is seeded from the same files.
const jsonProducts: Product[] = (productsData as Omit<Product, "published">[]).map((p) => ({
  ...p,
  published: true,
  variants: p.variants.map((v) => ({ ...v, stock: null })),
}));

const loadProducts = cache(async (includeHidden: boolean): Promise<Product[]> => {
  if (!hasDatabase) return jsonProducts;
  const sql = db();
  const [rows, variants] = await Promise.all([
    sql<ProductRow[]>`select * from products where ${includeHidden} or published order by sort, title`,
    sql<VariantRow[]>`select * from variants order by sort, id`,
  ]);
  return rows.map((p) => ({
    handle: p.handle,
    title: p.title,
    descriptionHtml: p.description_html,
    optionName: p.option_name,
    images: p.images,
    collections: p.collections,
    published: p.published,
    variants: variants
      .filter((v) => v.product_handle === p.handle)
      .map((v) => ({
        id: v.id,
        title: v.title,
        price: v.price,
        stock: v.stock,
        available: v.available && (v.stock === null || v.stock > 0),
      })),
  }));
});

export function getProducts() {
  return loadProducts(false);
}

export function getAllProductsForAdmin() {
  return loadProducts(true);
}

export const getCollections = cache(async (): Promise<Collection[]> => {
  if (!hasDatabase) return collectionsData as Collection[];
  return db()<Collection[]>`select handle, title, description, image from collections order by sort, title`;
});

export async function getProduct(handle: string) {
  return (await getProducts()).find((p) => p.handle === handle);
}

export async function getCollection(handle: string) {
  return (await getCollections()).find((c) => c.handle === handle);
}

export async function productsInCollection(handle: string) {
  return (await getProducts()).filter((p) => p.collections.includes(handle));
}

export async function findVariant(variantId: string) {
  for (const product of await getProducts()) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

export function priceRange(product: Product) {
  const prices = product.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
