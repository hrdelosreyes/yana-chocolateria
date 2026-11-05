import nodemailer, { type Transporter } from "nodemailer";
import { site } from "@/lib/site";

let transport: Transporter | undefined;

// Sends email from the shop's Gmail account. Does nothing if Gmail isn't configured,
// so the shop still works (HitPay also emails payment receipts).
export async function sendEmail(opts: { to: string; subject: string; html: string; replyTo?: string }) {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) {
    console.warn(`Email not sent (Gmail not configured): ${opts.subject}`);
    return;
  }
  transport ??= nodemailer.createTransport({ service: "gmail", auth: { user, pass: pass.replace(/\s/g, "") } });
  try {
    await transport.sendMail({
      from: { name: site.name, address: user },
      to: opts.to,
      subject: opts.subject,
      html: opts.html,
      replyTo: opts.replyTo,
    });
  } catch (err) {
    console.error(`Email failed: ${opts.subject}`, err);
  }
}

export function escapeHtml(value: string) {
  return value.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);
}
