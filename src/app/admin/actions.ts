"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logIn, logOut, requireAdmin } from "@/lib/admin-auth";
import { db } from "@/lib/db";
import { orderStatuses, updateOrderStatus, type OrderStatus } from "@/lib/order";

export async function loginAction(_state: { error: string } | null, form: FormData) {
  if (await logIn(String(form.get("password") ?? ""))) redirect("/admin");
  await new Promise((r) => setTimeout(r, 1000)); // slow down password guessing
  return { error: "Wrong password." };
}

export async function logoutAction() {
  await logOut();
  redirect("/admin/login");
}

export async function setOrderStatusAction(form: FormData) {
  await requireAdmin();
  const reference = String(form.get("reference"));
  const status = String(form.get("status")) as OrderStatus;
  if (!orderStatuses.some((s) => s.value === status)) throw new Error("Invalid status");
  await updateOrderStatus(reference, status);
  revalidatePath("/admin", "layout");
  redirect(`/admin/orders/${encodeURIComponent(reference)}?saved=1`);
}

function parsePrice(value: string) {
  const clean = value.replace(/[₱,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(clean)) return null;
  return Math.round(Number(clean) * 100);
}

export async function saveProductAction(_state: { error: string } | null, form: FormData) {
  await requireAdmin();
  const handle = String(form.get("handle"));
  const title = String(form.get("title") ?? "").trim();
  if (!title) return { error: "Product name can't be empty." };

  const variantIds = form.getAll("variantId").map(String);
  const variants: { id: string; price: number; stock: number | null; title: string | null; available: boolean }[] = [];
  for (const id of variantIds) {
    const price = parsePrice(String(form.get(`price.${id}`) ?? ""));
    if (price === null) return { error: "Please enter prices as numbers, e.g. 140 or 140.50." };
    const stockText = String(form.get(`stock.${id}`) ?? "").trim();
    const stock = stockText === "" ? null : Number(stockText);
    if (stock !== null && !(Number.isInteger(stock) && stock >= 0)) {
      return { error: "Stock must be a whole number (or blank to not track stock)." };
    }
    const variantTitle = String(form.get(`title.${id}`) ?? "").trim() || null;
    variants.push({ id, price, stock, title: variantTitle, available: form.get(`available.${id}`) === "on" });
  }

  await db().begin(async (sql) => {
    await sql`update products set
        title = ${title},
        description_html = ${String(form.get("description") ?? "")},
        published = ${form.get("published") === "on"},
        collections = ${form.getAll("collections").map(String)},
        updated_at = now()
      where handle = ${handle}`;
    for (const v of variants) {
      await sql`update variants set title = ${v.title}, price = ${v.price}, stock = ${v.stock}, available = ${v.available}
        where id = ${v.id} and product_handle = ${handle}`;
    }
  });
  revalidatePath("/", "layout");
  redirect(`/admin/products/${encodeURIComponent(handle)}?saved=1`);
}
