# YANA Chocolateria website: project summary

_Last updated: November 5, 2026_

The old Shopify store has been rebuilt as a custom site and moved to Vercel. It is live at
**https://yanachocolateria.com** (`www.yanachocolateria.com` redirects there).

## What's running

| Part | Service | Notes |
| --- | --- | --- |
| Website | Vercel (Hobby plan) | Next.js 16. Every push to `main` on GitHub redeploys automatically. |
| Code | GitHub: `hrdelosreyes/yana-chocolateria` | Private repository. |
| Database | Vercel Postgres (Neon) | Products, stock and orders. Tables are created/updated automatically on each deploy. |
| Payments | HitPay (live account) | GCash, Maya, QR Ph, cards. |
| Order emails | Gmail (`yanachocolateria23@gmail.com`) | **Not switched on yet**, see "Still to do". |
| Domain | Registered at GoDaddy, DNS managed by Vercel | Nameservers are `ns1/ns2.vercel-dns.com`. Add any future DNS records in Vercel, not GoDaddy. |

## What was built

**Storefront**
- All 25 products, 6 categories, photos, story text and policies copied from Shopify. Photos are stored with the site.
- Old Shopify links still work (e.g. `/products/caliber`, `/collections/all`).
- Premium design: serif headings, cocoa and gold palette, full-screen hero, category tiles, favourites, story band,
  branch cards, scroll animations, slide-out cart, quick add, related products.
- Two branches: **YANA Chocolateria** (Erwincel Bldg, Parañaque) and **YANA Cacao Kitchen** (SM City BF Parañaque).
- Checkout: branch pickup or courier delivery (courier fee paid separately to the courier).
- Rewritten Refund Policy, Privacy Policy (Data Privacy Act of 2012) and Terms of Service for the Philippines.

**Order tracking for customers** (`/order/track`, also linked in the footer, thank-you page and emails)
- Customer enters their order number plus the email or mobile number they used.
- Shows progress: Payment received → Being prepared → Ready for pickup / Out for delivery → Picked up / Delivered.
- While an order is **Paid – to prepare**, the customer can **cancel it for a refund** themselves.

**Admin** (`/admin`, password = `ADMIN_PASSWORD`)
- **Orders** by status, with customer details, items, pickup branch or delivery address and notes.
- **Products**: edit names, prices, stock, categories, descriptions, sold-out and show/hide.
- **Check payment with HitPay** for orders stuck at "Awaiting payment".
- **Refund via HitPay**, or **Mark as refunded** for refunds made outside HitPay (e.g. sent back by GCash).

## Order statuses: daily routine

| Status | What it means | Customer can cancel? | Customer email |
| --- | --- | --- | --- |
| Awaiting payment | Checkout started, not paid | n/a | none |
| **Paid – to prepare** | Paid, not started | **Yes, with refund** | "Thank you for your order" |
| **Preparing** | You've started making it | No | none |
| **Ready / out for delivery** | Ready at the branch, or with the courier | No | "Ready for pickup" / "On its way" |
| Completed | Picked up / delivered | No | none |
| Cancelled | Cancelled (refunded or not) | n/a | "Cancelled" or "Refunded" |

1. A new paid order appears under **Paid – to prepare** (and you get a "PAID" email once Gmail is on).
2. When you start making it, tap **Preparing**. This stops online cancellation.
3. When it's done, tap **Ready**. The customer is emailed.
4. After pickup or delivery, tap **Completed**.

Stock goes down when an order is paid and comes back if a paid order is cancelled or refunded.
Leave a product's stock blank to not track it.

## Refunds

- **Refund via HitPay** works for payment methods HitPay can refund (mostly cards).
- **GCash and QR Ph payments often can't be refunded through HitPay.** Send the money back yourself, then tap
  **Mark as refunded** on the order. This records it, cancels the order, returns stock and emails the customer.
- If a customer cancels a GCash/QR Ph order themselves, you get a "CANCELLED by customer… (please refund ₱…)"
  email. Refund them, then use **Mark as refunded**.

## Settings in Vercel (Settings → Environment Variables)

| Name | Status | Value |
| --- | --- | --- |
| `DATABASE_URL` | ✅ set | Added automatically by the Neon database |
| `ADMIN_PASSWORD` | ✅ set | Admin password |
| `HITPAY_API_KEY`, `HITPAY_SALT`, `HITPAY_WEBHOOK_SALT` | ✅ set | From the HitPay dashboard |
| `HITPAY_MODE` | ✅ set | `live` |
| `SITE_URL` | check | `https://yanachocolateria.com` |
| `GMAIL_USER` | ❌ missing | `yanachocolateria23@gmail.com` |
| `GMAIL_APP_PASSWORD` | ❌ missing | 16-character Google app password (myaccount.google.com/apppasswords; needs 2-Step Verification) |
| `ORDER_EMAIL_TO` | ❌ missing | Inbox for new-order alerts, e.g. `yanachocolateria23@gmail.com` |
| `ORDER_LINK_SECRET` | optional | Long random value that signs "Track your order" links (defaults to `HITPAY_SALT`) |

Redeploy after changing any setting (Deployments → ⋯ → Redeploy).

HitPay webhook address: `https://yanachocolateria.com/api/hitpay/webhook`

## Still to do

1. **Turn on emails**: add `GMAIL_USER`, `GMAIL_APP_PASSWORD` and `ORDER_EMAIL_TO`, then redeploy. Until then
   neither you nor customers receive any order emails, so check the admin regularly.
2. **Close the ₱30 test order** `YC-261105-20076D`: tap **Mark as refunded**, or just **Cancelled**.
3. **Before cancelling Shopify**, export customers and orders (Customers → Export, Orders → Export). The domain is
   at GoDaddy, so cancelling Shopify won't affect it; keep the GoDaddy registration renewed.
4. **Re-add any DNS records** you still need (e.g. Google Search Console, Meta/TikTok verification) in Vercel's
   DNS settings. The GoDaddy records were dropped when the nameservers moved to Vercel.
5. **Review the policies**: the drafts are a sensible start but not legal advice; confirm the allergen list, the
   timeframes in the refund policy (24-hour reporting, 3/7-day pickup), and whether to name a Data Protection Officer.

## Known limitations and ideas for later

- Adding brand-new products and uploading photos isn't in the admin yet (needs Vercel Blob); ask a developer, or
  Claude, to add products in the meantime.
- No email is sent when an order is marked Preparing or Completed.
- The first real HitPay webhook (12:45 PM, Nov 5) didn't mark the order paid; the thank-you-page check and the
  admin button recorded it instead. Webhook issues are now logged in Vercel → Logs ("HitPay webhook").
- Discount codes and customer accounts were dropped from the Shopify version.
