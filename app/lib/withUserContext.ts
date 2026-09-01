/**
 * @fileoverview Exécute une requête Drizzle dans un contexte RLS.
 *
 * RLS compare `owner_id` à `current_setting('app.current_user_id')` —
 * une variable de session PostgreSQL définie AVANT chaque requête.
 *
 * ⚠️ SET LOCAL n'accepte PAS les requêtes paramétrées ($1) : c'est une
 * commande de configuration PostgreSQL, pas une requête DML classique.
 * `sql\`SET LOCAL x = ${value}\`` échoue avec "syntax error at or near $1"
 * (voir l'erreur qu'on a eue). Il faut donc insérer la valeur directement
 * dans le texte SQL via sql.raw(), APRÈS validation stricte du format —
 * sinon ce serait une faille d'injection SQL.
 */

import { db } from "@/app/db";
import { sql } from "drizzle-orm";

/** UUID v4 standard : 8-4-4-4-12 caractères hexadécimaux. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function withUserContext<T>(
  userId: string,
  callback: (tx: typeof db) => Promise<T>
): Promise<T> {
  // Garde-fou indispensable : sans cette validation, insérer userId
  // directement dans le texte SQL (via sql.raw ci-dessous) serait une
  // injection SQL grande ouverte si userId contenait autre chose qu'un
  // UUID. Comme userId vient toujours de session.user.id (fourni par
  // NextAuth/notre propre base), ça ne devrait jamais échouer en usage
  // normal — cette vérification protège contre un bug ailleurs qui
  // laisserait passer une valeur inattendue.
  if (!UUID_REGEX.test(userId)) {
    throw new Error(`userId invalide pour withUserContext: ${userId}`);
  }

  return db.transaction(async (tx) => {
    await tx.execute(
      sql.raw(`SET LOCAL app.current_user_id = '${userId}'`)
    );
    return callback(tx as unknown as typeof db);
  });
}
