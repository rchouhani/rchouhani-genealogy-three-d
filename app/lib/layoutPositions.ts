/**
 * @fileoverview Calcule une position (x, y, z) FIXE pour chaque personne
 * de l'arbre — Option C validée avec l'utilisateur.
 *
 * Règles :
 *   - Y : dérivé du champ `generation` déjà stocké en base, comme avant
 *     (génération -1 = ancêtres → Y positif ; +1 = descendants → Y négatif).
 *
 *   - X (colonne) : toute la lignée DE SANG d'une personne reste dans
 *     UNE SEULE colonne, pour toujours, peu importe le nombre de
 *     générations remontées ou descendues. Une nouvelle colonne n'est
 *     créée QUE quand on traverse un lien "par alliance" (conjoint,
 *     beau-parent, beau-frère/sœur, gendre/bru) vers quelqu'un qui n'a
 *     pas encore de colonne — cette personne "entre" dans la famille
 *     avec sa propre colonne, où toute SA lignée de sang s'installera
 *     à son tour. Calculé par parcours en largeur (BFS) sur tout le
 *     graphe familial.
 *
 *     Alternatives envisagées et rejetées (voir échange avec l'utilisateur) :
 *       - Une nouvelle colonne par couple d'ancêtres → explose en nombre
 *         de colonnes à chaque génération remontée.
 *       - Recycler toujours les mêmes 2 colonnes → mélange des personnes
 *         sans aucun lien de sang dans la même case.
 *
 *   - Z (profondeur) : quand plusieurs personnes partagent la même case
 *     (colonne + génération), elles sont empilées sur Z, dans l'ordre
 *     d'ajout en base — approximé ici par l'ordre du tableau familyData
 *     en entrée. Pour une garantie stricte, la requête qui alimente
 *     familyData (fetchFamilyData / GET /api/persons) devrait trier
 *     explicitement par created_at ASC.
 */

import { Person } from '../types/family';
import { BLOOD_RELATION_TYPES } from './bloodTree';

export interface Position3D {
  x: number;
  y: number;
  z: number;
}

/** Espacements en unités Three.js — ajustables sans toucher à l'algorithme. */
export const LAYOUT_SPACING = {
  /** Distance verticale entre deux générations consécutives. */
  Y: 8,
  /** Distance horizontale entre deux colonnes de lignée différentes. */
  X: 7,
  /** Distance de profondeur entre deux personnes empilées dans une même case. */
  Z: 4,
};

/**
 * Attribue une colonne (un simple entier, pas encore multiplié par
 * LAYOUT_SPACING.X) à chaque personne, par parcours en largeur sur tout
 * le graphe familial.
 *
 * Deux règles de robustesse importantes :
 *   1. L'ANCRAGE (colonne 0) est explicitement la personne `selfId` si
 *      fournie — jamais "la première personne du tableau", qui dépendrait
 *      de l'ordre de retour de l'API (fragile, change selon l'ordre
 *      d'insertion en base plutôt que selon une vraie intention).
 *   2. Les nouvelles colonnes ALTERNENT de part et d'autre de 0
 *      (+1, -1, +2, -2, +3, ...) plutôt que de toujours incrémenter dans
 *      le même sens. Sans ça, la personne ancre (colonne 0) se retrouve
 *      systématiquement à l'extrémité GAUCHE de tout le reste de la
 *      famille (qui ne s'étale que vers la droite) — visuellement, la
 *      caméra centrée sur elle semble "avoir glissé" d'un côté.
 *
 * @param selfId - Id de la personne à ancrer en colonne 0. Si absente
 *                 ou introuvable, repli sur la première personne du
 *                 tableau (comportement de secours, pas le cas nominal).
 * @returns Map id → numéro de colonne (peut être négatif).
 */
function assignColumns(
  familyData: Person[],
  selfId?: string
): Map<string, number> {
  const columns = new Map<string, number>();
  const personById = new Map(familyData.map((p) => [p.id, p]));

  // Génère la séquence de nouvelles colonnes : 0 pour la toute première
  // (l'ancre), puis alternance +1, -1, +2, -2, +3, -3, ...
  let isFirstColumn = true;
  let side: 1 | -1 = 1;
  let magnitude = 1;
  function nextNewColumn(): number {
    if (isFirstColumn) {
      isFirstColumn = false;
      return 0;
    }
    const value = side * magnitude;
    if (side === 1) {
      side = -1;
    } else {
      side = 1;
      magnitude++;
    }
    return value;
  }

  function bfsFrom(startId: string) {
    columns.set(startId, nextNewColumn());

    const queue: string[] = [startId];
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      const current = personById.get(currentId);
      if (!current) continue;

      const currentColumn = columns.get(currentId)!;

      for (const rel of current.relations) {
        if (columns.has(rel.targetId)) continue; // déjà traité

        if (BLOOD_RELATION_TYPES.has(rel.type)) {
          // Lien de sang : même colonne que la personne courante.
          columns.set(rel.targetId, currentColumn);
        } else {
          // Lien "par alliance" : nouvelle colonne (alternée).
          columns.set(rel.targetId, nextNewColumn());
        }

        queue.push(rel.targetId);
      }
    }
  }

  // 1. Ancre explicite : selfId démarre TOUJOURS le tout premier parcours,
  // garantissant qu'il obtient la colonne 0, peu importe sa position
  // dans le tableau familyData.
  const anchorId =
    selfId && personById.has(selfId) ? selfId : familyData[0]?.id;
  if (anchorId) {
    bfsFrom(anchorId);
  }

  // 2. Le reste du tableau, pour couvrir les sous-graphes déconnectés
  // (ex. une famille sans aucun lien avec l'ancre) — ordre du tableau
  // conservé pour rester déterministe.
  for (const person of familyData) {
    if (!columns.has(person.id)) {
      bfsFrom(person.id);
    }
  }

  return columns;
}

/**
 * Calcule la position de chaque personne de la famille.
 *
 * @param familyData - Toutes les personnes de l'arbre, DANS L'ORDRE
 *                     D'AJOUT EN BASE si possible (utilisé pour Z).
 * @param selfId     - Id de la personne à ancrer visuellement au centre
 *                     (colonne 0). Typiquement la personne isSelf. Sans
 *                     cette ancre, la colonne 0 va par défaut à la
 *                     première personne du tableau — pas fiable pour
 *                     garantir "je suis toujours au centre visuel".
 * @returns Map id → { x, y, z }. Contient une entrée pour CHAQUE
 *          personne fournie.
 */
export function computeGenerationalLayout(
  familyData: Person[],
  selfId?: string
): Map<string, Position3D> {
  const positions = new Map<string, Position3D>();
  if (familyData.length === 0) return positions;

  const columns = assignColumns(familyData, selfId);

  // Regroupe par (colonne, génération) pour calculer Z : deux personnes
  // dans la même case sont celles qui partagent exactement ces deux valeurs.
  const groups = new Map<string, Person[]>();
  for (const person of familyData) {
    const column = columns.get(person.id)!;
    const key = `${column}|${person.generation}`;
    const list = groups.get(key) ?? [];
    list.push(person);
    groups.set(key, list);
  }

  for (const [, members] of groups) {
    // L'ORDRE DE familyData détermine l'ordre des Z au sein d'une case
    // (voir le tri déjà appliqué : `members` conserve l'ordre d'insertion
    // dans `groups`, lui-même dérivé de l'ordre de familyData).
    members.forEach((person, indexInGroup) => {
      const column = columns.get(person.id)!;
      // `|| 0` normalise -0 en 0 (généré par -SPACING×0 en JS).
      const y = (-LAYOUT_SPACING.Y * person.generation) || 0;

      positions.set(person.id, {
        x: column * LAYOUT_SPACING.X,
        y,
        z: indexInGroup * LAYOUT_SPACING.Z,
      });
    });
  }

  return positions;
}
