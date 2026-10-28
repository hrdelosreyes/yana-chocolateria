import Link from "next/link";
import Image from "next/image";
import { ProductGrid } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { getProducts } from "@/lib/catalog";
import { branches, site } from "@/lib/site";
import { features, hero, pillars, promise } from "@/content/story";

// Best sellers first, then a few signature pieces to fill the row.
const favouriteHandles = ["caliber", "sukacao", "nama-box-of-9", "bonbons-1", "bigbars", "nycookie", "truffle", "hchocobomb"];

export default async function Home() {
  const products = await getProducts();
  const favourites = favouriteHandles
    .map((h) => products.find((p) => p.handle === h))
    .filter((p) => p !== undefined)
    .slice(0, 8);

  return (
    <>
      <section className="home-hero">
        <div className="home-hero-media">
          <Image src="/images/site/hero-bites.webp" alt="" fill priority sizes="100vw" />
        </div>
        <div className="container home-hero-content">
          <p className="eyebrow">{hero.eyebrow}</p>
          <h1>{hero.title}</h1>
          <p className="home-hero-body">{hero.body}</p>
          <div className="button-row">
            <Link href="/shop" className="button primary large">
              Shop chocolates
            </Link>
            <Link href="/about" className="button ghost large">
              Our story
            </Link>
          </div>
        </div>
        <a href="#collections" className="scroll-cue" aria-label="Scroll down">
          <span />
        </a>
      </section>

      <section className="trust-strip">
        <ul className="container">
          <li>Single-origin Davao cacao</li>
          <li>Family-owned chocolatier</li>
          <li>Pickup at 2 branches</li>
          <li>GCash, Maya & cards</li>
        </ul>
      </section>

      <section id="collections" className="section container">
        <Reveal>
          <p className="eyebrow center">The collection</p>
          <h2 className="display-title center">Something for every craving</h2>
        </Reveal>
        <div className="category-tiles">
          {features.map((f, i) => (
            <Reveal key={f.collection} delay={i * 80}>
              <Link href={`/collections/${f.collection}`} className="category-tile">
                <Image src={f.image} alt="" fill sizes="(max-width: 768px) 80vw, 25vw" />
                <div className="category-tile-text">
                  <h3>{f.title}</h3>
                  <p>{f.body}</p>
                  <span className="tile-link">
                    Shop {f.title.toLowerCase()} <span aria-hidden>→</span>
                  </span>
                </div>
              </Link>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal className="section-head">
          <div>
            <p className="eyebrow">Customer favourites</p>
            <h2 className="display-title">Most-loved treats</h2>
          </div>
          <Link href="/shop" className="text-link">
            View all <span aria-hidden>→</span>
          </Link>
        </Reveal>
        <Reveal>
          <ProductGrid products={favourites} />
        </Reveal>
      </section>

      <section className="story-band">
        <div className="container story-band-inner">
          <Reveal className="story-band-image">
            <Image src="/images/site/couverture.webp" alt="Yana couverture chocolate bar with nuts" fill sizes="(max-width: 768px) 100vw, 50vw" />
          </Reveal>
          <Reveal className="story-band-text" delay={100}>
            <p className="eyebrow">{promise.title}</p>
            <blockquote>
              “Each Yana chocolate embodies the love and passion that drives us, ensuring that every bite delivers an
              experience that is truly exceptional.”
            </blockquote>
            <Link href="/about" className="button ghost">
              Read our story
            </Link>
          </Reveal>
        </div>
      </section>

      <section className="section container">
        <div className="pillars">
          {pillars.map((p, i) => (
            <Reveal key={p.title} delay={i * 100} className="pillar">
              <span className="pillar-number">0{i + 1}</span>
              <h3>{p.title}</h3>
              <p>{p.body}</p>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="marquee" aria-label={site.tagline}>
        <div className="marquee-track" aria-hidden>
          {Array.from({ length: 2 }).map((_, i) => (
            <span key={i}>
              Chocolate Excellence <em>✦</em> Mouthwatering <em>✦</em> The Perfect Gift <em>✦</em> Philippine Cacao{" "}
              <em>✦</em> Chocolate Excellence <em>✦</em> Mouthwatering <em>✦</em> The Perfect Gift <em>✦</em> Philippine
              Cacao <em>✦</em>{" "}
            </span>
          ))}
        </div>
      </section>

      <section className="section container">
        <Reveal>
          <p className="eyebrow center">Visit us</p>
          <h2 className="display-title center">Find us near you</h2>
        </Reveal>
        <div className="branch-tiles">
          {branches.map((b, i) => (
            <Reveal key={b.id} delay={i * 80}>
              <a
                className="branch-tile"
                href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name} ${b.address}`)}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                <span className="eyebrow">{b.name}</span>
                <h3>{b.place}</h3>
                <p>{b.address}</p>
                <span className="tile-link">
                  Get directions <span aria-hidden>→</span>
                </span>
              </a>
            </Reveal>
          ))}
        </div>
      </section>
    </>
  );
}
