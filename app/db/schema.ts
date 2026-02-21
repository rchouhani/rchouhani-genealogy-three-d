/**
 * @fileoverview Schéma de la base de données PostgreSQL via Drizzle.
 *
 * Ce fichier est la SOURCE DE VÉRITÉ de la structure de la base.
 * Les types inférés depuis ce schéma remplacent les interfaces manuelles
 * de family.ts pour tout ce qui touche à la persistance.
 *
 * Tables :
 *   - persons   : les membres de l'arbre généalogique
 *   - relations : les liens entre membres
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enum : types de relations
// ---------------------------------------------------------------------------

/**
 * Types de relations stockés en base.
 * Correspond à StoredRelationType dans family.ts.
 */
export const relationTypeEnum = pgEnum("relation_type", [
  "parent",
  "child",
  "sibling",
  "spouse",
]);

// ---------------------------------------------------------------------------
// Table : persons
// ---------------------------------------------------------------------------

export const persons = pgTable("persons", {
  /** UUID généré automatiquement par PostgreSQL. */
  id: uuid("id").defaultRandom().primaryKey(),

  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),

  /**
   * Position verticale dans l'arbre 3D.
   * 0 = racine, valeurs positives = générations descendantes.
   */
  generation: integer("generation").notNull(),

  // --- Champs optionnels anticipés ---
  birthName: text("birth_name"),
  /** Format ISO 8601 : "1945-03-12" */
  birthDate: text("birth_date"),
  /** Format ISO 8601. Absent = en vie. */
  deathDate: text("death_date"),
  birthLocation: text("birth_location"),
  deathLocation: text("death_location"),
  /** URL vers le fichier hébergé (ex. Cloudflare R2). */
  photoUrl: text("photo_url"),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Table : relations
// ---------------------------------------------------------------------------

export const relations = pgTable("relations", {
  id: uuid("id").defaultRandom().primaryKey(),

  /**
   * ID de la personne "source" de la relation.
   * Ex : si sourceId=A, targetId=B, type="child" → B est l'enfant de A.
   */
  sourceId: uuid("source_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),

  /**
   * ID de la personne "cible" de la relation.
   */
  targetId: uuid("target_id")
    .notNull()
    .references(() => persons.id, { onDelete: "cascade" }),

  type: relationTypeEnum("type").notNull(),

  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ---------------------------------------------------------------------------
// Types inférés (utilisés dans les routes API)
// ---------------------------------------------------------------------------

export type PersonRow = typeof persons.$inferSelect;
export type NewPerson = typeof persons.$inferInsert;
export type RelationRow = typeof relations.$inferSelect;
export type NewRelation = typeof relations.$inferInsert;
