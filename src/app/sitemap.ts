import type { MetadataRoute } from "next";
import { collections, products } from "@/lib/catalog";

export default function sitemap(): MetadataRoute.Sitemap {
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
