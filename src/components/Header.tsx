import Link from "next/link";
import Image from "next/image";
import { getCollection } from "@/lib/catalog";
import { navCollections } from "@/lib/site";
import { CartButton } from "./CartButton";
import { HeaderShell } from "./HeaderShell";

export async function Header() {
  const links = (await Promise.all(navCollections.map((h) => getCollection(h)))).filter((c) => c !== undefined);
  return (
    <>
      <div className="announcement">
        <p>Pick up at our 2 branches or get it delivered · Pay with GCash, Maya, QR Ph & cards</p>
      </div>
      <HeaderShell>
        <div className="container header-inner">
          <details className="mobile-nav">
            <summary aria-label="Menu">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
                <path d="M4 7h16M4 12h16M4 17h16" />
              </svg>
            </summary>
            <nav>
              <Link href="/shop">Shop All</Link>
              {links.map((c) => (
                <Link key={c.handle} href={`/collections/${c.handle}`}>
                  {c.title}
                </Link>
              ))}
              <Link href="/about">Our Story</Link>
              <Link href="/pages/contact">Visit Us</Link>
            </nav>
          </details>
          <nav className="desktop-nav">
            <Link href="/shop">Shop</Link>
            {links.slice(0, 4).map((c) => (
              <Link key={c.handle} href={`/collections/${c.handle}`}>
                {c.title}
              </Link>
            ))}
          </nav>
          <Link href="/" className="logo" aria-label="YANA Chocolateria home">
            <Image src="/images/site/logo-white.webp" alt="YANA Chocolateria" width={150} height={90} priority />
          </Link>
          <div className="header-actions">
            <nav className="desktop-nav">
              <Link href="/about">Our Story</Link>
              <Link href="/pages/contact">Visit Us</Link>
            </nav>
            <CartButton />
          </div>
        </div>
      </HeaderShell>
    </>
  );
}
