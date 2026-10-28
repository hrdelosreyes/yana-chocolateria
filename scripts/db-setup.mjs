// Creates the database tables and, on first run, loads the products from
// src/data/*.json. Runs automatically before every build; safe to re-run.
import postgres from "postgres";
import { readFile } from "node:fs/promises";

const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;
if (!url) {
  console.log("db-setup: no DATABASE_URL, skipping (site will use src/data/*.json)");
  process.exit(0);
}

const sql = postgres(url, { max: 1, prepare: false, onnotice: () => {} });

await sql.unsafe(`
  create table if not exists collections (
    handle text primary key,
    title text not null,
    description text not null default '',
    image text,
    sort integer not null default 0
  );
  create table if not exists products (
    handle text primary key,
    title text not null,
    description_html text not null default '',
    option_name text,
    images jsonb not null default '[]',
    collections text[] not null default '{}',
    published boolean not null default true,
    sort integer not null default 0,
    updated_at timestamptz not null default now()
  );
  create table if not exists variants (
    id text primary key,
    product_handle text not null references products(handle) on delete cascade,
    title text,
    price integer not null check (price >= 0),
    available boolean not null default true,
    stock integer check (stock is null or stock >= 0),
    sort integer not null default 0
  );
  create table if not exists orders (
    reference text primary key,
    status text not null default 'pending',
    created_at timestamptz not null default now(),
    paid_at timestamptz,
    total integer not null,
    customer_name text not null,
    customer_email text not null,
    customer_phone text not null,
    fulfillment_method text not null,
    fulfillment_text text not null,
    notes text not null default '',
    hitpay_request_id text,
    hitpay_payment_id text
  );
  create index if not exists orders_created_at_idx on orders (created_at desc);
  create index if not exists orders_hitpay_request_idx on orders (hitpay_request_id);
  create table if not exists order_items (
    id serial primary key,
    order_reference text not null references orders(reference) on delete cascade,
    variant_id text,
    product_title text not null,
    variant_title text,
    quantity integer not null,
    unit_price integer not null
  );
`);

const [{ count }] = await sql`select count(*)::int as count from products`;
if (count === 0) {
  const products = JSON.parse(await readFile(new URL("../src/data/products.json", import.meta.url), "utf8"));
  const collections = JSON.parse(await readFile(new URL("../src/data/collections.json", import.meta.url), "utf8"));
  await sql.begin(async (tx) => {
    for (const [i, c] of collections.entries()) {
      await tx`insert into collections (handle, title, description, image, sort)
        values (${c.handle}, ${c.title}, ${c.description}, ${c.image}, ${i}) on conflict do nothing`;
    }
    for (const [i, p] of products.entries()) {
      await tx`insert into products (handle, title, description_html, option_name, images, collections, sort)
        values (${p.handle}, ${p.title}, ${p.descriptionHtml}, ${p.optionName}, ${tx.json(p.images)}, ${p.collections}, ${i})`;
      for (const [j, v] of p.variants.entries()) {
        await tx`insert into variants (id, product_handle, title, price, available, sort)
          values (${v.id}, ${p.handle}, ${v.title}, ${v.price}, ${v.available}, ${j})`;
      }
    }
  });
  console.log(`db-setup: loaded ${products.length} products and ${collections.length} collections`);
} else {
  console.log(`db-setup: tables ready (${count} products)`);
}
await sql.end();
