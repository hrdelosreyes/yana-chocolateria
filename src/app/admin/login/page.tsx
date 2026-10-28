import { redirect } from "next/navigation";
import { adminPasswordConfigured, isAdmin } from "@/lib/admin-auth";
import { LoginForm } from "./LoginForm";

export default async function LoginPage() {
  if (await isAdmin()) redirect("/admin");
  return (
    <div className="admin-login">
      <h1>Sign in</h1>
      {adminPasswordConfigured() ? (
        <LoginForm />
      ) : (
        <p className="error">Set ADMIN_PASSWORD in Vercel (Settings → Environment Variables), then redeploy.</p>
      )}
    </div>
  );
}
