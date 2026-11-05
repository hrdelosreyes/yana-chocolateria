"use server";

import { redirect } from "next/navigation";
import { hasDatabase } from "@/lib/db";
import { findOrderForCustomer } from "@/lib/order";
import { orderToken } from "@/lib/order-links";

export async function lookupOrderAction(_state: { error: string } | null, form: FormData) {
  const reference = String(form.get("reference") ?? "").trim().toUpperCase();
  const contact = String(form.get("contact") ?? "");
  if (!reference || !contact.trim()) return { error: "Please enter your order number and your email or mobile number." };
  const order = hasDatabase ? await findOrderForCustomer(reference, contact) : undefined;
  if (!order) {
    await new Promise((r) => setTimeout(r, 800)); // slow down guessing
    return {
      error:
        "We couldn't find an order with those details. Check the order number (it starts with YC-) and use the email or mobile number you ordered with.",
    };
  }
  redirect(`/order/track?ref=${encodeURIComponent(order.reference)}&t=${orderToken(order.reference)}`);
}
