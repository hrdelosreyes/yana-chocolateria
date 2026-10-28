import Link from "next/link";

export default function NotFound() {
  return (
    <div className="section container narrow center">
      <h1 className="page-title">Page not found</h1>
      <Link href="/shop" className="button primary">
        Continue shopping
      </Link>
    </div>
  );
}
