import postgres from "postgres";

// Set automatically when a Vercel Postgres (Neon) database is connected to the project.
const url = process.env.DATABASE_URL || process.env.POSTGRES_URL;

export const hasDatabase = Boolean(url);

let client: postgres.Sql | undefined;

export function db() {
  if (!url) throw new Error("No database connected (DATABASE_URL is not set)");
  // prepare: false is required by Neon's pooled (PgBouncer) connection.
  client ??= postgres(url, { max: 5, idle_timeout: 20, prepare: false });
  return client;
}
