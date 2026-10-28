import Link from "next/link";
import ShopLayout from "./(shop)/layout";

export default function NotFound() {
  return (
    <ShopLayout>
      <div className="section container narrow center">
        <h1 className="page-title">Page not found</h1>
        <Link href="/shop" className="button primary">
          Continue shopping
        </Link>
      </div>
    </ShopLayout>
  );
}
