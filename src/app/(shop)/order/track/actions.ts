"use server";

import { redirect } from "next/navigation";
import { hasDatabase } from "@/lib/db";
import { findOrderForCustomer } from "@/lib/order";
import { orderToken, verifyOrderToken } from "@/lib/order-links";
import { CancelError, cancelByCustomer } from "@/lib/payments";

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

export async function cancelOrderAction(_state: { error: string } | null, form: FormData) {
  const reference = String(form.get("reference") ?? "");
  const token = String(form.get("token") ?? "");
  if (!verifyOrderToken(reference, token)) return { error: "This link isn't valid. Please look up your order again." };
  if (form.get("confirm") !== "on") return { error: "Tick the box to confirm you want to cancel." };
  try {
    await cancelByCustomer(reference);
  } catch (err) {
    if (err instanceof CancelError) return { error: err.message };
    console.error(`Customer cancel failed for ${reference}`, err);
    return { error: "Something went wrong. Please try again, or contact us to cancel." };
  }
  redirect(`/order/track?ref=${encodeURIComponent(reference)}&t=${token}`);
}
