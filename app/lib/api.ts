/**
 * @fileoverview Fonctions d'accès à l'API depuis le client.
 *
 * Toutes les interactions avec la base de données passent par ces fonctions.
 * Elles sont utilisées dans page.tsx pour charger et modifier les données.
 *
 * Chaque fonction :
 *   - Gère les erreurs et les retourne proprement.
 *   - Retourne les données typées.
 *   - Ne contient aucune logique métier.
 */

import { Person, Relation } from "@/app/types/family";

// ---------------------------------------------------------------------------
// Types intermédiaires (réponse brute de l'API avant transformation)
// ---------------------------------------------------------------------------

interface PersonRow {
  id: string;
  firstName: string;
  lastName: string;
  generation: number;
  birthName?: string | null;
  birthDate?: string | null;
  deathDate?: string | null;
  birthLocation?: string | null;
  deathLocation?: string | null;
  photoUrl?: string | null;
}

interface RelationRow {
  id: string;
  sourceId: string;
  targetId: string;
  type: "parent" | "child" | "sibling" | "spouse";
}

// ---------------------------------------------------------------------------
// Chargement initial
// ---------------------------------------------------------------------------

/**
 * Charge toutes les personnes et leurs relations depuis l'API,
 * et les assemble en un tableau de Person prêt pour la scène 3D.
 *
 * @returns Liste des personnes avec leurs relations.
 * @throws Error si le chargement échoue.
 */
export async function fetchFamilyData(): Promise<Person[]> {
  const [personsRes, relationsRes] = await Promise.all([
    fetch("/api/persons"),
    fetch("/api/relations"),
  ]);

  if (!personsRes.ok || !relationsRes.ok) {
    throw new Error("Erreur lors du chargement des données.");
  }

  const personRows: PersonRow[] = await personsRes.json();
  const relationRows: RelationRow[] = await relationsRes.json();

  // Assembler les relations sur chaque personne
  return personRows.map((p) => ({
    id: p.id,
    firstName: p.firstName,
    lastName: p.lastName,
    generation: p.generation,
    birthName: p.birthName ?? undefined,
    birthDate: p.birthDate ?? undefined,
    deathDate: p.deathDate ?? undefined,
    birthLocation: p.birthLocation ?? undefined,
    deathLocation: p.deathLocation ?? undefined,
    photoUrl: p.photoUrl ?? undefined,
    relations: relationRows
      .filter((r) => r.sourceId === p.id)
      .map((r): Relation => ({
        // On garde l'id de la ligne "relations" en base : c'est ce qui
        // permet de cibler EXACTEMENT cette entrée avec DELETE /api/relations/:id
        // (rappel : une relation UI = 2 lignes en base, une par sens).
        id: r.id,
        targetId: r.targetId,
        type: r.type,
      })),
  }));
}

// ---------------------------------------------------------------------------
// Ajout d'un membre
// ---------------------------------------------------------------------------

/**
 * Crée une nouvelle personne en base.
 *
 * @param data - Données de la personne (sans ID ni relations).
 * @returns La personne créée avec son ID.
 */
export async function createPerson(
  data: Omit<Person, "id" | "relations">
): Promise<PersonRow> {
  const res = await fetch("/api/persons", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Erreur lors de la création de la personne.");
  }

  return res.json();
}

/**
 * Crée une relation bidirectionnelle entre deux personnes.
 * La route API crée automatiquement les deux sens.
 *
 * @param sourceId - ID de la personne source.
 * @param targetId - ID de la personne cible.
 * @param type     - Type de relation (du point de vue de la source).
 */
export async function createRelation(
  sourceId: string,
  targetId: string,
  type: Relation["type"]
): Promise<void> {
  const res = await fetch("/api/relations", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ sourceId, targetId, type }),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Erreur lors de la création de la relation.");
  }
}

// ---------------------------------------------------------------------------
// Mise à jour
// ---------------------------------------------------------------------------

/**
 * Met à jour les champs d'une personne.
 *
 * @param id   - UUID de la personne.
 * @param data - Champs à mettre à jour (sous-ensemble de Person).
 */
export async function updatePerson(
  id: string,
  // deathDate/deathLocation exclus de l'Omit puis redéfinis avec `| null` :
  // même correction que dans page.tsx et EditPersonForm.tsx. Sans ça,
  // TypeScript fusionne "string | undefined" (hérité de Person) avec
  // "string | null" par intersection et perd le `null`, qui sert pourtant
  // à vider explicitement la date de décès quand l'utilisateur décoche
  // "décédé(e)" (voir EditPersonForm.handleSubmit).
  data: Partial<
    Omit<Person, "id" | "relations" | "deathDate" | "deathLocation">
  > & {
    deathDate?: string | null;
    deathLocation?: string | null;
  }
): Promise<PersonRow> {
  const res = await fetch(`/api/persons/${id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Erreur lors de la mise à jour.");
  }

  return res.json();
}

// ---------------------------------------------------------------------------
// Suppression
// ---------------------------------------------------------------------------

/**
 * Supprime une personne et toutes ses relations (cascade).
 *
 * @param id - UUID de la personne à supprimer.
 */
export async function deletePerson(id: string): Promise<void> {
  const res = await fetch(`/api/persons/${id}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Erreur lors de la suppression.");
  }
}

// ---------------------------------------------------------------------------
// Suppression d'une relation
// ---------------------------------------------------------------------------

/**
 * Supprime UNE SEULE entrée relation (un seul sens).
 *
 * Rappel important : une relation "visuelle" (ex. Pierre ↔ Lucas, père/fils)
 * correspond à DEUX lignes en base (Pierre→Lucas type="father" ET
 * Lucas→Pierre type="son"). Pour supprimer complètement le lien, il faut
 * appeler cette fonction DEUX FOIS avec les deux id concernés.
 * C'est EditPersonForm / page.tsx qui orchestre ce double appel,
 * pas cette fonction (elle reste volontairement simple, un seul id = un seul DELETE).
 *
 * @param relationId - UUID de la ligne "relations" à supprimer (Relation.id).
 */
export async function deleteRelation(relationId: string): Promise<void> {
  const res = await fetch(`/api/relations/${relationId}`, {
    method: "DELETE",
  });

  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error ?? "Erreur lors de la suppression de la relation.");
  }
}
