import { neon } from "@neondatabase/serverless";
export function getSql() {
 const url = process.env.DATABASE_URL;
 if (!url) throw new Error("Database is not configured.");
 return neon(url);
}
