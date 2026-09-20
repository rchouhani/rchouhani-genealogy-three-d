/**
 * @fileoverview Calcule l'ensemble des personnes "de sang" pour une
 * personne donnée : lignée directe (ascendants/descendants), fratrie
 * (y compris demi-fratrie), oncles/tantes, cousins, grand-oncles/tantes.
 *
 * Exclut explicitement tout ce qui est "par alliance" : conjoint,
 * beau-parent (quel que soit son sens réel), beau-frère/belle-sœur,
 * gendre/bru. Le conjoint agit comme une VRAIE coupure dans le parcours :
 * on ne traverse jamais au-delà, donc la famille du conjoint (même ses
 * parents à elle) n'apparaît jamais dans l'arbre de sang de quelqu'un
 * d'autre — cohérent avec "l'arbre de sang" de chacun restant le sien.
 *
 * Utilisé par l'effet de survol (Phase C) : quand on survole une
 * personne, c'est CET ensemble qui apparaît en fondu à 40%.
 */

import { Person } from '../types/family';
import { RelationType } from '../utils/generation';

/**
 * Types de relations traversés par le parcours — tout le reste
 * ("par alliance") stoppe la traversée à cette arête précise.
 *
 * Exportée (pas seulement locale à ce fichier) : layoutPositions.ts la
 * réutilise pour déterminer quand une nouvelle colonne X doit être créée
 * (à chaque traversée d'un lien HORS de cette liste), afin de ne jamais
 * dupliquer cette liste de types à deux endroits différents.
 */
export const BLOOD_RELATION_TYPES = new Set<RelationType>([
  // Lignée directe
  'parent', 'mother', 'father',
  'child', 'son', 'daughter',
  // Fratrie (y compris demi-fratrie, sang partiel)
  'sibling', 'brother', 'sister',
  'stepBrother', 'stepSister',
  // Famille élargie
  'uncle', 'aunt', 'cousin', 'nephew', 'niece',
  // Intergénérationnel
  'grandFather', 'grandMother', 'grandParent',
  'grandChild', 'grandUncle', 'grandAunt',
]);

/**
 * Calcule l'arbre de sang d'une personne par parcours en largeur (BFS),
 * en ne suivant QUE les arêtes de type "sang" (voir BLOOD_RELATION_TYPES).
 *
 * @param personId   - Personne dont on veut l'arbre de sang.
 * @param familyData - Toutes les personnes de l'arbre.
 * @returns Set d'ids incluant personId lui-même.
 */
export function computeBloodTreeIds(
  personId: string,
  familyData: Person[]
): Set<string> {
  const visited = new Set<string>([personId]);
  const personById = new Map(familyData.map((p) => [p.id, p]));

  // Si la personne n'existe pas dans familyData, on retourne quand même
  // un Set contenant juste son id — comportement cohérent avec
  // getVisiblePersonIds() dans relationFilters.ts (même philosophie).
  if (!personById.has(personId)) return visited;

  const queue: string[] = [personId];

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    const current = personById.get(currentId);
    if (!current) continue;

    for (const rel of current.relations) {
      // Arête "par alliance" : on n'avance pas dessus, quel que soit
      // ce qu'il y a de l'autre côté.
      if (!BLOOD_RELATION_TYPES.has(rel.type)) continue;

      if (!visited.has(rel.targetId)) {
        visited.add(rel.targetId);
        queue.push(rel.targetId);
      }
    }
  }

  return visited;
}
