/**
 * @fileoverview Types métier de l'application Genealogy3D.
 *
 * Ce fichier contient UNIQUEMENT les types de domaine (métier).
 * Aucune dépendance envers Three.js ou autre librairie de rendu.
 * Ces types sont aussi le blueprint direct de la future base de données.
 *
 * Séparation :
 *   - family.ts  → types métier (ce fichier)
 *   - scene.ts   → types liés au rendu Three.js
 */

// ---------------------------------------------------------------------------
// Relation
// ---------------------------------------------------------------------------

/**
 * Types de relations stockés en base.
 * Valeurs volontairement restreintes : la granularité (ex. "mother" vs "father")
 * est gérée au niveau de l'UI via RelationType dans utils/generation.ts.
 */
export type StoredRelationType = "parent" | "child" | "sibling" | "spouse";

/**
 * Une relation entre deux personnes.
 *
 * @property targetId  - ID de la personne liée (celle vers qui la relation pointe).
 * @property type      - Nature de la relation depuis le point de vue du propriétaire.
 *
 * Exemple : si Person A a une relation { targetId: B, type: "child" },
 *           ça signifie "B est l'enfant de A".
 */
export interface Relation {
  targetId: string;  // UUID
  type: StoredRelationType;
}

// ---------------------------------------------------------------------------
// Person
// ---------------------------------------------------------------------------

/**
 * Une personne dans l'arbre généalogique.
 *
 * Tous les champs optionnels ci-dessous sont anticipés pour la BDD.
 * Ils sont volontairement présents maintenant pour éviter de changer
 * le type plus tard et casser les imports.
 *
 * @property id         - UUID PostgreSQL (ex. "a3f2b1c4-..."). Généré par la base.
 * @property firstName  - Prénom.
 * @property lastName   - Nom de famille.
 * @property generation - Génération dans l'arbre (0 = racine). Utilisé pour le layout 3D.
 * @property relations  - Liste des relations de cette personne vers d'autres.
 *
 * Champs anticipés BDD (optionnels pour l'instant) :
 * @property birthName      - Nom de naissance (si différent du lastName actuel).
 * @property birthDate      - Date de naissance.
 * @property deathDate      - Date de décès (undefined = en vie).
 * @property birthLocation  - Lieu de naissance.
 * @property deathLocation  - Lieu de décès.
 * @property photoUrl       - URL vers la photo hébergée externement.
 */
export interface Person {
  id: string;  // UUID (ex. "a3f2b1c4-...")
  firstName: string;
  lastName: string;
  generation: number;
  relations: Relation[];

  // --- Champs anticipés BDD — optionnels aujourd'hui ---
  birthName?: string;
  birthDate?: string;       // ISO 8601 (ex. "1945-03-12"). String pour éviter les problèmes de sérialisation.
  deathDate?: string;       // ISO 8601. Absent = en vie.
  birthLocation?: string;
  deathLocation?: string;
  photoUrl?: string;        // URL vers le storage externe (ex. Cloudflare R2).
}
