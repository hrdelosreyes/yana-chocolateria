import type { Metadata } from "next";
import Link from "next/link";
import { ClearCart } from "@/components/ClearCart";
import { site } from "@/lib/site";

export const metadata: Metadata = { title: "Order", robots: { index: false } };

type Props = { searchParams: Promise<{ ref?: string; status?: string }> };

export default async function OrderComplete({ searchParams }: Props) {
  const { ref, status } = await searchParams;
  const paid = status === "completed";
  return (
    <div className="section container narrow center">
      {paid ? (
        <>
          <ClearCart reference={ref} />
          <h1 className="page-title">Thank you!</h1>
          <p className="lead">
            Your payment went through{ref ? ` for order ${ref}` : ""}. We&apos;ll email you when it&apos;s ready for pickup
            or on its way.
          </p>
          <p>
            <Link href={ref ? `/order/track?ref=${encodeURIComponent(ref)}` : "/order/track"} className="button primary">
              Track your order
            </Link>
          </p>
        </>
      ) : (
        <>
          <h1 className="page-title">Payment not completed</h1>
          <p className="lead">Your order wasn&apos;t paid. Your cart has been kept so you can try again.</p>
          <Link href="/checkout" className="button primary">
            Back to checkout
          </Link>
        </>
      )}
      <p className="muted">
        Questions? Email <a href={`mailto:${site.email}`}>{site.email}</a> or call{" "}
        <a href={site.phoneHref}>{site.phone}</a>.
      </p>
    </div>
  );
}
