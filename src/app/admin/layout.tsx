import type { Metadata } from "next";
import Link from "next/link";
import { isAdmin } from "@/lib/admin-auth";
import { hasDatabase } from "@/lib/db";
import { logoutAction } from "./actions";
import "../admin.css";

export const metadata: Metadata = { title: "Admin", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const signedIn = await isAdmin();
  return (
    <div className="admin">
      <header className="admin-header">
        <div className="container admin-header-inner">
          <strong>Yana Admin</strong>
          {signedIn && (
            <nav>
              <Link href="/admin">Orders</Link>
              <Link href="/admin/products">Products</Link>
              <Link href="/" target="_blank">
                View site
              </Link>
              <form action={logoutAction}>
                <button type="submit">Log out</button>
              </form>
            </nav>
          )}
        </div>
      </header>
      <main className="container admin-main">
        {signedIn && !hasDatabase ? (
          <p className="error">
            No database is connected. In Vercel, open the project → Storage → connect a Postgres (Neon) database, then
            redeploy.
          </p>
        ) : (
          children
        )}
      </main>
    </div>
  );
}
