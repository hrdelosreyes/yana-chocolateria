import type { Metadata } from "next";
import { branches, site } from "@/lib/site";

export const metadata: Metadata = { title: "Contact" };

export default function Contact() {
  return (
    <div className="section container narrow">
      <h1 className="page-title">Contact</h1>
      <p className="lead center">
        Email <a href={`mailto:${site.email}`}>{site.email}</a> or call <a href={site.phoneHref}>{site.phone}</a>.
      </p>
      <div className="branch-list">
        {branches.map((b) => (
          <div key={b.id} className="branch">
            <h2>{b.name}</h2>
            <p className="muted">{b.place}</p>
            <p>{b.address}</p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${b.name} ${b.address}`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Open in Google Maps
            </a>
          </div>
        ))}
      </div>
      <p className="center socials">
        {site.socials.map((s) => (
          <a key={s.name} href={s.href} target="_blank" rel="noopener noreferrer">
            {s.name}
          </a>
        ))}
      </p>
    </div>
  );
}
