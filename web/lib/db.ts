import "server-only";

import { config } from "dotenv";
import { resolve } from "node:path";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";

import * as schema from "@/lib/schema";

config({ path: resolve(process.cwd(), "../.env.local") });

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  throw new Error("DATABASE_URL is required to connect to the store database.");
}

neonConfig.webSocketConstructor = ws;

const globalForDb = globalThis as typeof globalThis & {
  storePool?: Pool;
};

const pool =
  globalForDb.storePool ??
  new Pool({
    connectionString,
    max: 5,
  });

if (process.env.NODE_ENV !== "production") {
  globalForDb.storePool = pool;
}

export const db = drizzle(pool, { schema });
