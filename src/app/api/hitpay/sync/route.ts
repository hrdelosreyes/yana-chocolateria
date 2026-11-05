import { NextResponse } from "next/server";
import { hasDatabase } from "@/lib/db";
import { syncOrderPayment } from "@/lib/payments";

// Called by the order confirmation page so a paid order is recorded even if
// HitPay's webhook is late or fails. Only checks HitPay; it never trusts the browser.
export async function POST(request: Request) {
  if (!hasDatabase) return NextResponse.json({ ok: true });
  const { reference } = (await request.json().catch(() => ({}))) as { reference?: unknown };
  if (typeof reference !== "string" || !/^YC-\d{6}-[0-9A-F]{6}$/.test(reference)) {
    return NextResponse.json({ error: "Invalid reference" }, { status: 400 });
  }
  try {
    await syncOrderPayment(reference);
  } catch (err) {
    console.error(`HitPay sync failed for ${reference}`, err);
  }
  return NextResponse.json({ ok: true });
}
