/**
 * @fileoverview Affichage des connexions d'une personne via BFS.
 *
 * Quand on clique sur une personne, cette fonction parcourt son graphe
 * de relations (breadth-first search) et affiche uniquement les lignes
 * connectées dans un rayon de 10 relations.
 *
 * Toutes les autres lignes sont cachées.
 *
 * @param startId    - ID de la personne cliquée.
 * @param lines      - Liste des lignes dans la scène.
 * @param familyData - Données des personnes pour accéder aux relations.
 */

import { LineObject } from "../types/scene";
import { Person } from "../types/family";

export default function showConnections(
  startId: number,
  lines: LineObject[],
  familyData: Person[]
) {
  const queue = [startId];
  const visited = new Set(queue);
  let count = 0;

  // Masquer toutes les lignes au départ
  lines.forEach((l) => (l.line.visible = false));

  while (queue.length > 0 && count < 10) {
    const currentId = queue.shift()!;
    const person = familyData.find((p) => p.id === currentId);

    if (!person) continue;

    person.relations.forEach((rel) => {
      if (!visited.has(rel.targetId) && count < 10) {
        visited.add(rel.targetId);
        queue.push(rel.targetId);
        count++;
      }

      // Afficher la ligne correspondante
      lines.forEach((l) => {
        if (
          (l.sourceId === currentId && l.targetId === rel.targetId) ||
          (l.targetId === currentId && l.sourceId === rel.targetId)
        ) {
          l.line.visible = true;
        }
      });
    });
  }
}
