import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep old Shopify URLs working so links and search results don't break.
  async redirects() {
    return [
      { source: "/collections/all", destination: "/shop", permanent: true },
      { source: "/collections", destination: "/shop", permanent: true },
      { source: "/collections/:handle/products/:product", destination: "/products/:product", permanent: true },
      { source: "/policies/contact-information", destination: "/pages/contact", permanent: true },
      { source: "/account/:path*", destination: "/", permanent: false },
    ];
  },
};

export default nextConfig;
