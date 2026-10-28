import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

const COOKIE = "yana_admin";
const MAX_AGE = 60 * 60 * 24 * 14; // 14 days

export function adminPasswordConfigured() {
  return Boolean(process.env.ADMIN_PASSWORD);
}

function sign(expires: string) {
  // Keyed by the password, so changing ADMIN_PASSWORD logs everyone out.
  return createHmac("sha256", process.env.ADMIN_PASSWORD!).update(`admin:${expires}`).digest("hex");
}

function sameText(a: string, b: string) {
  const ha = createHash("sha256").update(a).digest();
  const hb = createHash("sha256").update(b).digest();
  return timingSafeEqual(ha, hb);
}

export async function isAdmin() {
  if (!adminPasswordConfigured()) return false;
  const value = (await cookies()).get(COOKIE)?.value;
  const [expires, signature] = value?.split(".") ?? [];
  if (!expires || !signature || Number(expires) < Date.now() / 1000) return false;
  return sameText(signature, sign(expires));
}

export async function requireAdmin() {
  if (!(await isAdmin())) redirect("/admin/login");
}

export async function logIn(password: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected || !sameText(password, expected)) return false;
  const expires = String(Math.floor(Date.now() / 1000) + MAX_AGE);
  (await cookies()).set(COOKIE, `${expires}.${sign(expires)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE,
  });
  return true;
}

export async function logOut() {
  (await cookies()).delete(COOKIE);
}
