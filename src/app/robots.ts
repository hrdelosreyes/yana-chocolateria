import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const base = (process.env.SITE_URL || "https://www.yanachocolateria.com").replace(/\/$/, "");
  return { rules: { userAgent: "*", allow: "/", disallow: ["/checkout", "/cart", "/api/"] }, sitemap: `${base}/sitemap.xml` };
}
