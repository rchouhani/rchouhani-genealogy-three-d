/**
 * @fileoverview Connexion à la base PostgreSQL via Neon + Drizzle.
 *
 * Driver : neon-serverless (WebSocket via Pool), PAS neon-http.
 * Pourquoi ce changement : neon-http ne supporte PAS db.transaction(),
 * qu'utilise withUserContext() pour poser `SET LOCAL app.current_user_id`
 * avant chaque requête (nécessaire pour RLS). neon-http est plus léger et
 * suffisait tant qu'aucune requête n'avait besoin de transaction — ce
 * n'est plus le cas depuis l'introduction de withUserContext.
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

import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "./schema";

// neon-serverless a besoin d'une implémentation WebSocket en environnement
// Node.js (le navigateur en a une nativement, pas Node) — le package `ws`
// la fournit. Sans ça : erreur "WebSocket is not defined" au démarrage.
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL est manquante. Vérifie ton fichier .env.local."
  );
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, { schema });
