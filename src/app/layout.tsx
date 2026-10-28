import type { Metadata } from "next";
import { DM_Sans, Jost } from "next/font/google";
import { site } from "@/lib/site";
import "./globals.css";

const body = DM_Sans({ subsets: ["latin"], variable: "--font-body" });
const heading = Jost({ subsets: ["latin"], variable: "--font-heading" });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || "https://www.yanachocolateria.com"),
  title: { default: site.name, template: `%s | ${site.name}` },
  description: site.description,
  icons: { icon: "/images/site/icon.webp" },
  openGraph: { siteName: site.name, type: "website", images: ["/images/site/hero-bites.webp"] },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${body.variable} ${heading.variable}`}>
      <body>{children}</body>
    </html>
  );
}
