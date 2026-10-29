# YANA Chocolateria website

Next.js site for www.yanachocolateria.com, hosted on Vercel, with checkout through HitPay
(GCash, Maya, QR Ph, cards). Products, photos and text were copied from the old Shopify store.

## Database (Vercel Postgres / Neon)

Products, stock and orders are stored in Postgres. Before every build `scripts/db-setup.mjs` creates the
tables and, the first time only, loads the products from `src/data/*.json`. After that the database is
the source of truth: edit products in the admin, not in the JSON files.

Without a database connected the site still works read-only from `src/data/*.json`, and orders go by email only.

## Admin (`/admin`)

Sign in with `ADMIN_PASSWORD`.

- **Orders:** tabs for Paid (to prepare), Ready, Completed, Cancelled and Awaiting payment. Open an order to
  see the items, customer, pickup branch or delivery address, and to change its status.
- **Products:** change names, prices, stock, categories, descriptions, sold-out and show/hide. Changes appear
  on the site right away. Leave stock blank to not track it; when tracked stock reaches 0 the item shows as
  sold out. Adding new products and photos isn't in the admin yet.

Branches (pickup locations, footer, contact page) and contact details are in `src/lib/site.ts`.

## How an order works

1. The customer checks out, choosing pickup at a branch or courier delivery (courier fee paid separately).
2. `/api/checkout` re-prices the cart from the database, checks stock, saves the order as "Awaiting payment",
   and sends the customer to HitPay.
3. After payment HitPay calls `/api/hitpay/webhook`. The site checks HitPay's signature and that the amount
   matches, marks the order Paid, takes the items out of stock, and (if Resend is set up) emails the shop and
   the customer.

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
| `ORDER_EMAIL_FROM` | e.g. `YANA Chocolateria <orders@yanachocolateria.com>` (domain must be verified in Resend) |
| `ADMIN_PASSWORD` | Password for `/admin`. Use a long, unique one |
| `DATABASE_URL` | Added automatically when you connect a Neon database under Storage |

## Local development

```bash
npm install
cp .env.example .env.local   # fill in values
npm run dev
```

With `DATABASE_URL` set, run `npm run db:setup` once to create and fill the tables.
