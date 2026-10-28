import type { MetadataRoute } from "next";
import { getCollections, getProducts } from "@/lib/catalog";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [collections, products] = await Promise.all([getCollections(), getProducts()]);
  const base = (process.env.SITE_URL || "https://www.yanachocolateria.com").replace(/\/$/, "");
  const paths = [
    "",
    "/shop",
    "/about",
    "/pages/contact",
    ...collections.map((c) => `/collections/${c.handle}`),
    ...products.map((p) => `/products/${p.handle}`),
  ];
  return paths.map((p) => ({ url: base + p }));
}
