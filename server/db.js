import pgPromise from "pg-promise";
import "./env.js";

const pgp = pgPromise();

export const db = pgp(
  process.env.DATABASE_URL ||
    "postgres://appuser:apppass@127.0.0.1:5433/project_tasks",
);

export async function closeDb() {
  await db.$pool.end();
}
