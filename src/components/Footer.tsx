import Link from "next/link";
import { branches, site } from "@/lib/site";

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="container footer-grid">
        {branches.map((b) => (
          <div key={b.id}>
            <h3>{b.name}</h3>
            <p>{b.address}</p>
            {b.id === "paranaque-ups5" && (
              <p>
                Tel: <a href={site.phoneHref}>{site.phone}</a>
                <br />
                Email: <a href={`mailto:${site.email}`}>{site.email}</a>
              </p>
            )}
          </div>
        ))}
      </div>
      <div className="container footer-bottom">
        <nav>
          <Link href="/about">About Us</Link>
          <Link href="/shop">Shop</Link>
          <Link href="/pages/contact">Contact</Link>
          <Link href="/policies/refund-policy">Refund policy</Link>
          <Link href="/policies/privacy-policy">Privacy policy</Link>
          <Link href="/policies/terms-of-service">Terms of service</Link>
        </nav>
        <nav>
          {site.socials.map((s) => (
            <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer">
              {s.name}
            </a>
          ))}
        </nav>
        <p>© {new Date().getFullYear()} {site.name}</p>
      </div>
    </footer>
  );
}
