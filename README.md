# Yana Chocolateria website

Next.js site for www.yanachocolateria.com, hosted on Vercel, with checkout through HitPay
(GCash, Maya, QR Ph, cards). Products, photos and text were copied from the old Shopify store.

## Editing products

Products live in `src/data/products.json` and categories in `src/data/collections.json`.
Prices are in **centavos** (₱140.00 = `14000`). Set `"available": false` to mark a variant sold out.
Product photos are in `public/images/products/`. Commit and push a change, and Vercel redeploys automatically.

Branches (pickup locations, footer, contact page) and contact details are in `src/lib/site.ts`.

## How an order works

1. The customer fills the cart and checks out, choosing pickup at a branch or courier delivery
   (the courier fee is paid separately).
2. `/api/checkout` re-prices the cart from `products.json`, creates a HitPay payment request and sends the
   customer to HitPay. If Resend is set up, the shop gets a "New order – awaiting payment" email with full details.
3. After payment HitPay calls `/api/hitpay/webhook`. The site checks HitPay's signature and emails
   "PAID: order YC-…" to the shop and a confirmation to the customer.
4. Every payment also shows up in the HitPay dashboard, with the order number and items in the description.

## Environment variables (Vercel → Project → Settings → Environment Variables)

See `.env.example`.

| Name | Value |
| --- | --- |
| `SITE_URL` | `https://www.yanachocolateria.com` |
| `HITPAY_API_KEY` | HitPay dashboard → Settings → Payment Gateway → API Keys |
| `HITPAY_SALT` | Same page as the API key |
| `HITPAY_MODE` | `sandbox` while testing, `live` when ready |
| `RESEND_API_KEY` | Optional, from resend.com, for order emails |
| `ORDER_EMAIL_TO` | Inbox that receives orders |
| `ORDER_EMAIL_FROM` | e.g. `Yana Chocolateria <orders@yanachocolateria.com>` (domain must be verified in Resend) |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```
