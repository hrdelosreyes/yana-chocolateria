import type { Metadata } from "next";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { notFound } from "next/navigation";

const policies: Record<string, string> = {
  "refund-policy": "Refund policy",
  "privacy-policy": "Privacy policy",
  "terms-of-service": "Terms of service",
};

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return Object.keys(policies).map((slug) => ({ slug }));
}

export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  return { title: policies[(await params).slug] };
}

export default async function Policy({ params }: Props) {
  const { slug } = await params;
  if (!policies[slug]) notFound();
  const html = await readFile(path.join(process.cwd(), "src/content/policies", `${slug}.html`), "utf8");
  return (
    <div className="section container narrow">
      <h1 className="page-title">{policies[slug]}</h1>
      <div className="rte" dangerouslySetInnerHTML={{ __html: html }} />
    </div>
  );
}
