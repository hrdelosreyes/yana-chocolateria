import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/ProductCard";
import { productsInCollection } from "@/lib/catalog";
import { site } from "@/lib/site";
import { features, promise } from "@/content/story";

export default function Home() {
  const bestSellers = productsInCollection("best-sellers");
  return (
    <>
      <section className="hero">
        <Image src="/images/site/hero-bites.webp" alt="" fill priority sizes="100vw" />
        <div className="hero-content container">
          <h1>{promise.title}</h1>
          <p>{promise.body}</p>
          <Link href="/shop" className="button primary">
            Shop now
          </Link>
        </div>
      </section>

      {features.map((f, i) => (
        <section key={f.collection} className={`feature ${i % 2 ? "reverse" : ""}`}>
          <div className="container feature-inner">
            <div className="feature-image">
              <Image src={f.image} alt={f.title} fill sizes="(max-width: 768px) 100vw, 50vw" />
            </div>
            <div className="feature-text">
              <h2>{f.title}</h2>
              <p>{f.body}</p>
              <Link href={`/collections/${f.collection}`} className="button">
                {f.cta}
              </Link>
            </div>
          </div>
        </section>
      ))}

      <section className="band">
        <p className="container">{site.tagline}</p>
      </section>

      {bestSellers.length > 0 && (
        <section className="section container">
          <h2 className="section-title">Best Sellers</h2>
          <ProductGrid products={bestSellers} />
          <p className="center">
            <Link href="/shop" className="button">
              View all products
            </Link>
          </p>
        </section>
      )}
    </>
  );
}
