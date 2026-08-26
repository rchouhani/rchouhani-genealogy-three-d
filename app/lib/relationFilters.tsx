/**
 * @fileoverview Logique de filtrage des relations affichées.
 *
 * Permet de filtrer les personnes visibles selon 5 catégories :
 *   - Mes proches (parents, enfants, fratrie, conjoint)
 *   - Famille élargie (oncles/tantes, cousins, neveux/nièces)
 *   - Famille recomposée (beaux-parents, demi-frères/sœurs)
 *   - Par alliance (beaux-frères/sœurs, gendres/brus)
 *   - Intergénérationnel (grands-parents, petits-enfants, etc.)
 *
 * Comportement par défaut : si aucun filtre actif, afficher "Mes proches".
 */

import { Person } from '../types/family';
import { RelationType } from '../utils/generation';
import { RelationFilters, RelationFilterCategory } from '../types/scene';

// ---------------------------------------------------------------------------
// Mapping : Relation → Catégories
// ---------------------------------------------------------------------------

/**
 * Map un type de relation vers les catégories auxquelles il appartient.
 * Une relation peut appartenir à plusieurs catégories.
 */
const RELATION_TO_CATEGORIES: Record<RelationType, RelationFilterCategory[]> = {
  // Mes proches
  child: ['proches'],
  son: ['proches'],
  daughter: ['proches'],
  parent: ['proches'],
  mother: ['proches'],
  father: ['proches'],
  sibling: ['proches'],
  brother: ['proches'],
  sister: ['proches'],
  spouse: ['proches'],
  wife: ['proches'],
  husband: ['proches'],

  // Famille élargie
  uncle: ['elargie'],
  aunt: ['elargie'],
  cousin: ['elargie'],
  nephew: ['elargie'],
  niece: ['elargie'],

  // Famille recomposée
  stepFather: ['recomposee'],
  stepMother: ['recomposee'],
  stepBrother: ['recomposee'],
  stepSister: ['recomposee'],

  // Par alliance
  brotherInLaw: ['parAlliance'],
  sisterInLaw: ['parAlliance'],
  sonInLaw: ['parAlliance'],
  daughterInLaw: ['parAlliance'],

  // Intergénérationnel
  grandFather: ['intergenerationnel'],
  grandMother: ['intergenerationnel'],
  grandParent: ['intergenerationnel'],
  grandChild: ['intergenerationnel'],
  grandUncle: ['intergenerationnel'],
  grandAunt: ['intergenerationnel'],
};

/**
 * Retourne les catégories auxquelles appartient une relation.
 *
 * @param relationType - Type de relation stocké en base.
 * @returns Tableau de catégories.
 */
export function getRelationCategory(
  relationType: RelationType
): RelationFilterCategory[] {
  return RELATION_TO_CATEGORIES[relationType] || [];
}

// ---------------------------------------------------------------------------
// Logique de filtrage
// ---------------------------------------------------------------------------

/**
 * Détermine quels IDs de personnes doivent être visibles selon les filtres actifs.
 *
 * Comportement : union stricte des catégories cochées, sans filet de
 * sécurité. Si aucune case n'est cochée, seule la personne sélectionnée
 * elle-même est visible (aucune ligne). C'est délibéré : la checkbox
 * "Mes proches" doit refléter fidèlement ce qui est affiché — avant, un
 * filet de sécurité affichait "proches" même case décochée, ce qui rendait
 * l'état visuel de la checkbox trompeur (voir échange avec l'utilisateur).
 * FilterPanel est initialisé avec "proches: true" par défaut dans page.tsx
 * pour éviter un arbre vide au tout premier affichage.
 *
 * @param startId     - ID de la personne sélectionnée.
 * @param familyData  - Liste complète des personnes.
 * @param filters     - Filtres actifs.
 * @returns Set d'IDs des personnes visibles.
 */
export function getVisiblePersonIds(
  startId: string,
  familyData: Person[],
  filters: RelationFilters
): Set<string> {
  const visible = new Set<string>([startId]);

  const person = familyData.find((p) => p.id === startId);
  if (!person) return visible;

  // Catégories cochées, sans filet de sécurité : si l'ensemble est vide,
  // aucune relation ne sera retenue plus bas (boucle sans effet).
  const activeCategories: Set<RelationFilterCategory> = new Set();
  (Object.keys(filters) as Array<keyof RelationFilters>).forEach((key) => {
    if (filters[key]) {
      activeCategories.add(key);
    }
  });

  // Filtrer les relations selon les catégories actives
  person.relations.forEach((rel) => {
    const categories = getRelationCategory(rel.type);

    // Si la relation appartient à au moins une catégorie active, l'inclure
    const isVisible = categories.some((cat) => activeCategories.has(cat));

    if (isVisible) {
      visible.add(rel.targetId);
    }
  });

  return visible;
}
