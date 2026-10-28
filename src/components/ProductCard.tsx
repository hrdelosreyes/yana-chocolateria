import Link from "next/link";
import Image from "next/image";
import { priceRange, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";
import { QuickAdd } from "./QuickAdd";

export function ProductCard({ product }: { product: Product }) {
  const { min, max } = priceRange(product);
  const soldOut = product.variants.every((v) => !v.available);
  const [first, second] = product.images;
  return (
    <article className="product-card">
      <div className="product-card-media">
        <Link href={`/products/${product.handle}`} className="product-card-image" tabIndex={-1} aria-hidden>
          {first && <Image src={first} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="primary-image" />}
          {second && <Image src={second} alt="" fill sizes="(max-width: 640px) 50vw, 25vw" className="hover-image" />}
        </Link>
        {soldOut && <span className="badge">Sold out</span>}
        {!soldOut && <QuickAdd product={product} />}
      </div>
      <div className="product-card-body">
        <h3>
          <Link href={`/products/${product.handle}`}>{product.title}</Link>
        </h3>
        <p className="price">{min === max ? formatPrice(min) : `From ${formatPrice(min)}`}</p>
      </div>
    </article>
  );
}

export function ProductGrid({ products }: { products: Product[] }) {
  return (
    <div className="product-grid">
      {products.map((p) => (
        <ProductCard key={p.handle} product={p} />
      ))}
    </div>
  );
}
