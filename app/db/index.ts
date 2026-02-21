/**
 * @fileoverview Connexion à la base PostgreSQL via Neon + Drizzle.
 *
 * Pattern singleton : une seule instance de db partagée.
 * Critique en serverless pour éviter d'ouvrir une connexion
 * à chaque invocation de route API.
 *
 * Utilisation dans les routes :
 *   import { db } from "@/app/db";
 *   import { persons } from "@/app/db/schema";
 *   const all = await db.select().from(persons);
 */

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL est manquante. Vérifie ton fichier .env.local."
  );
}

const sql = neon(process.env.DATABASE_URL);

export const db = drizzle(sql, { schema });
