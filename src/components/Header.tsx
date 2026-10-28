import Link from "next/link";
import Image from "next/image";
import { getCollection } from "@/lib/catalog";
import { navCollections } from "@/lib/site";
import { CartButton } from "./CartButton";

export function Header() {
  const links = navCollections.map((h) => getCollection(h)!).filter(Boolean);
  return (
    <header className="site-header">
      <div className="container header-inner">
        <details className="mobile-nav">
          <summary aria-label="Menu">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
              <path d="M4 7h16M4 12h16M4 17h16" />
            </svg>
          </summary>
          <nav>
            <Link href="/about">About Us</Link>
            <Link href="/shop">Shop All</Link>
            {links.map((c) => (
              <Link key={c.handle} href={`/collections/${c.handle}`}>
                {c.title}
              </Link>
            ))}
            <Link href="/pages/contact">Contact</Link>
          </nav>
        </details>
        <Link href="/" className="logo" aria-label="Yana Chocolateria home">
          <Image src="/images/site/logo-white.webp" alt="Yana Chocolateria" width={150} height={90} priority />
        </Link>
        <nav className="desktop-nav">
          <Link href="/about">About Us</Link>
          <Link href="/shop">Shop</Link>
          {links.map((c) => (
            <Link key={c.handle} href={`/collections/${c.handle}`}>
              {c.title}
            </Link>
          ))}
          <Link href="/pages/contact">Contact</Link>
        </nav>
        <CartButton />
      </div>
    </header>
  );
}
