/**
 * @fileoverview Calcul de génération basé sur le type de relation.
 *
 * Ce fichier contient les types de relations détaillés utilisés dans l'UI
 * (ex. "mother", "father", "brother") et le calcul de génération pour le layout 3D.
 *
 * Le shift de génération détermine la position verticale dans l'arbre :
 *   - parent : -1 (une génération au-dessus)
 *   - child  : +1 (une génération en-dessous)
 *   - sibling: 0  (même génération)
 *   - spouse : 0  (même génération)
 */

/**
 * Types de relations détaillés disponibles dans l'UI.
 * Ces types sont mappés vers les types stockés (StoredRelationType) dans page.tsx.
 */
export type RelationType =
  | "parent"
  | "mother"
  | "father"
  | "child"
  | "sibling"
  | "son"
  | "daughter"
  | "sister"
  | "brother"
  | "spouse"
  | "wife"
  | "husband"
  | "grandParent"
  | "grandFather"
  | "grandMother"
  | "grandUncle"
  | "grandAunt"
  | "grandChild"
  | "uncle"
  | "aunt"
  | "nephew"
  | "niece"
  | "cousin"
  | "brotherInLaw"
  | "sisterInLaw"
  | "stepMother"
  | "stepFather"
  | "sonInLaw"
  | "daughterInLaw"
  | "stepBrother"
  | "stepSister";

/**
 * Shift de génération pour chaque type de relation.
 * Utilisé pour calculer la position verticale dans l'arbre 3D.
 */
const generationShiftByRelation: Record<RelationType, number> = {
  parent: -1,
  mother: -1,
  father: -1,
  child: +1,
  son: +1,
  daughter: +1,

  // IMPORTANT : sibling à 0 (même génération, pas +1)
  sibling: 0,
  sister: 0,
  brother: 0,

  spouse: 0,
  wife: 0,
  husband: 0,

  grandParent: -2,
  grandFather: -2,
  grandMother: -2,
  grandUncle: -2,
  grandAunt: -2,
  grandChild: +2,

  uncle: -1,
  aunt: -1,
  nephew: +1,
  niece: +1,
  cousin: 0,

  brotherInLaw: 0,
  sisterInLaw: 0,
  stepMother: -1,
  stepFather: -1,
  sonInLaw: +1,
  daughterInLaw: +1,
  stepBrother: 0,
  stepSister: 0,
};

/**
 * Calcule la génération d'une nouvelle personne basée sur une personne de référence.
 *
 * @param targetGeneration - Génération de la personne de référence.
 * @param relationType     - Type de relation entre la nouvelle personne et la référence.
 * @returns La génération calculée pour la nouvelle personne.
 *
 * @example
 * computeGeneration(1, "child") // → 2 (l'enfant d'une personne de génération 1 est en génération 2)
 * computeGeneration(1, "sibling") // → 1 (un frère est à la même génération)
 */
export function computeGeneration(
  targetGeneration: number,
  relationType: RelationType
): number {
  const shift = generationShiftByRelation[relationType] ?? 0;
  return targetGeneration + shift;
}
