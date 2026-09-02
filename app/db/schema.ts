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
 *   - users/accounts/sessions/verification_tokens : NextAuth (v4)
 */

import {
  pgTable,
  uuid,
  text,
  integer,
  timestamp,
  pgEnum,
  primaryKey,
} from "drizzle-orm/pg-core";

// ---------------------------------------------------------------------------
// Enum : types de relations
// ---------------------------------------------------------------------------

/**
 * Types de relations stockés en base.
 * Correspond à StoredRelationType dans family.ts.
 */
export const relationTypeEnum = pgEnum("relation_type", [
  // Mes proches
  "parent", "mother", "father",
  "child", "son", "daughter",
  "sibling", "brother", "sister",
  "spouse", "wife", "husband",

  // Famille élargie
  "uncle", "aunt", "cousin", "nephew", "niece",

  // Famille recomposée
  "stepFather", "stepMother", "stepBrother", "stepSister",

  // Par alliance
  "brotherInLaw", "sisterInLaw", "sonInLaw", "daughterInLaw",

  // Intergénérationnel
  "grandFather", "grandMother", "grandParent",
  "grandChild", "grandUncle", "grandAunt",
]);

// ---------------------------------------------------------------------------
// Tables NextAuth v4 (schéma requis par @next-auth/drizzle-adapter)
// ---------------------------------------------------------------------------

export const users = pgTable("users", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: text("name"),
  email: text("email").notNull(),
  emailVerified: timestamp("email_verified"),
  image: text("image"),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    // Pas de contrainte de type précise ici : AdapterAccountType est un
    // type Auth.js v5 (@auth/core), inexistant dans next-auth v4.
    type: text("type").notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: uuid("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires").notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires").notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ---------------------------------------------------------------------------
// Table : persons
// ---------------------------------------------------------------------------

export const persons = pgTable("persons", {
  /** UUID généré automatiquement par PostgreSQL. */
  id: uuid("id").defaultRandom().primaryKey(),
  
  ownerId: uuid("owner_id").notNull().references(() => users.id, { onDelete: "cascade" }),
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
  updatedAt: timestamp("updated_at").defaultNow().notNull().$onUpdate(() => new Date()),});

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
