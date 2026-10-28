import productsData from "@/data/products.json";
import collectionsData from "@/data/collections.json";

export type Variant = { id: string; title: string | null; price: number; available: boolean };
export type Product = {
  handle: string;
  title: string;
  descriptionHtml: string;
  optionName: string | null;
  images: string[];
  collections: string[];
  variants: Variant[];
};
export type Collection = { handle: string; title: string; description: string; image: string | null };

export const products = productsData as Product[];
export const collections = collectionsData as Collection[];

export function getProduct(handle: string) {
  return products.find((p) => p.handle === handle);
}

export function getCollection(handle: string) {
  return collections.find((c) => c.handle === handle);
}

export function productsInCollection(handle: string) {
  return products.filter((p) => p.collections.includes(handle));
}

export function findVariant(variantId: string) {
  for (const product of products) {
    const variant = product.variants.find((v) => v.id === variantId);
    if (variant) return { product, variant };
  }
  return undefined;
}

export function priceRange(product: Product) {
  const prices = product.variants.map((v) => v.price);
  return { min: Math.min(...prices), max: Math.max(...prices) };
}
