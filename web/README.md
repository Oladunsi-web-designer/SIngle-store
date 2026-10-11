# Dunfeto

Premium Living, Reliable Appliances — a Nigerian home-appliance storefront built
with Next.js App Router, Tailwind CSS, Lucide React, Drizzle ORM, and Neon
Serverless Postgres.

## Environment

The project reads the workspace-root `../.env.local`. Keep the existing Neon
`DATABASE_URL` and `DATABASE_URL_UNPOOLED` values in place, and add:

```dotenv
ADMIN_EMAIL=store-admin@example.com
ADMIN_PASSWORD=use-a-long-unique-password
```

Use your own credentials. Do not commit `.env.local`; it is ignored by Git.
`DATABASE_URL` is the pooled application connection. Drizzle migrations use the
direct `DATABASE_URL_UNPOOLED` connection.

## Run locally

```bash
npm install
npm run dev
```

Run these commands from `web/`. The home page, category and product views, cart,
and checkout use the public product and order APIs. `/admin` requires the
configured admin credentials. Its signed, HTTP-only session cookie expires
after eight hours.

## Schema, migrations, and seed data

The Drizzle model is in `lib/schema.ts`. It contains `categories`, `products`,
`orders`, and `order_items` (the order-line snapshot table). Prices and order
totals are integer Nigerian naira amounts; product rows store an optional
`original_price` for discount display.

Generate and review the initial migration:

```bash
npm run db:generate
```

After reviewing, apply it to the intended Neon branch with:

```bash
npm run db:migrate
npm run db:seed
```

**These last two commands modify the database.** `db:migrate` applies schema
changes and `db:seed` inserts or updates the sample categories and products.
They have not been run for this setup.

The seed contains sample Hisense, Haier Thermocool, Century, LG, and Nexus
appliances. Update image URLs and sample stock/pricing before a real launch.

## Routes

- `/` storefront with search, featured products, category filtering, and
  price sorting.
- `/products/[slug]` appliance detail and add-to-cart / buy-now.
- `/checkout` delivery contact details and order submission.
- `/admin` protected product upload, inline stock management, product removal,
  and order status dashboard.
- `GET /api/products` public active-product list; optional `category`, `q`,
  `sort`, and `limit` query parameters.
- `POST /api/products`, `PATCH /api/products/[id]`, and
  `DELETE /api/products/[id]` require a valid admin session.
- `POST /api/orders` creates a pending order and decrements stock atomically.
- `/api/admin/*` routes require the same admin session.

Order details contain personal data and are not exposed through public
read endpoints. Checkout creates a pending request; payment processing and
delivery-fee calculation are not part of this starter store.

The WhatsApp help link opens a message draft that customers can direct to your
support number. Configure a business number before launch if you want direct
chat routing.
