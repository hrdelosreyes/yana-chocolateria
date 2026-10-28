import Link from "next/link";
import Image from "next/image";
import { priceRange, type Product } from "@/lib/catalog";
import { formatPrice } from "@/lib/money";

export function ProductCard({ product }: { product: Product }) {
  const { min, max } = priceRange(product);
  const soldOut = product.variants.every((v) => !v.available);
  return (
    <Link href={`/products/${product.handle}`} className="product-card">
      <div className="product-card-image">
        {product.images[0] && (
          <Image src={product.images[0]} alt={product.title} fill sizes="(max-width: 640px) 50vw, 25vw" />
        )}
        {soldOut && <span className="badge">Sold out</span>}
      </div>
      <h3>{product.title}</h3>
      <p className="price">{min === max ? formatPrice(min) : `From ${formatPrice(min)}`}</p>
    </Link>
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
