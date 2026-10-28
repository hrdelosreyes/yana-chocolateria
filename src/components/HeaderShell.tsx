"use client";

import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";

// Transparent over the homepage hero, solid once the page scrolls.
export function HeaderShell({ children }: { children: React.ReactNode }) {
  const overHero = usePathname() === "/";
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <header className={`site-header ${overHero && !scrolled ? "transparent" : ""}`}>{children}</header>;
}
