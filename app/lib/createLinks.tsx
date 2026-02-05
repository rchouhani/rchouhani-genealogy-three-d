/**
 * @fileoverview Création des liens (traits) entre les personnes.
 *
 * Chaque relation dans familyData génère une ligne Three.js entre deux points.
 * Les lignes sont visibles par défaut et peuvent être cachées sélectivement
 * via bfs.ts au click.
 *
 * Couleurs par type de relation :
 *   - parent : rouge (0xff0000)
 *   - child  : vert  (0x00ff00)
 *   - sibling: jaune (0xffff00)
 *   - spouse : cyan  (0x00ffff)
 *
 * Le champ `type` est stocké sur LineObject pour permettre
 * l'affichage du type de relation au hover (étape 4).
 *
 * @param scene      - Scène Three.js où ajouter les lignes.
 * @param familyData - Données des personnes et leurs relations.
 * @param points     - Meshes des personnes (pour récupérer positions).
 * @returns Liste des LineObject créés.
 */

import * as THREE from "three";
import { Person } from "../types/family";
import { LineObject } from "../types/scene";

export function createLinks(
  scene: THREE.Scene,
  familyData: Person[],
  points: THREE.Mesh[]
): LineObject[] {
  const lines: LineObject[] = [];

  familyData.forEach((person) => {
    person.relations.forEach((rel) => {
      // Trouver les meshes source et cible via userData.id
      const fromMesh = points.find((p) => p.userData?.id === person.id);
      const toMesh = points.find((p) => p.userData?.id === rel.targetId);

      if (!fromMesh || !toMesh) return;

      // Éviter les doublons : si la ligne existe déjà dans l'autre sens, skip
      const exists = lines.some(
        (l) =>
          (l.sourceId === person.id && l.targetId === rel.targetId) ||
          (l.sourceId === rel.targetId && l.targetId === person.id)
      );

      if (exists) return;

      // Couleur selon le type de relation
      const color =
        rel.type === "child"
          ? 0x00ff00
          : rel.type === "parent"
          ? 0xff0000
          : rel.type === "sibling"
          ? 0xffff00
          : 0x00ffff; // spouse

      const material = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
      });

      // Copier les positions pour que la géométrie soit indépendante
      const pFrom = new THREE.Vector3().copy(fromMesh.position);
      const pTo = new THREE.Vector3().copy(toMesh.position);

      const geometry = new THREE.BufferGeometry().setFromPoints([pFrom, pTo]);
      const line = new THREE.Line(geometry, material);

      // IMPORTANT : visible = true par défaut
      // bfs.ts les cachera sélectivement au click
      line.visible = true;

      scene.add(line);

      lines.push({
        sourceId: person.id,
        targetId: rel.targetId,
        line,
        type: rel.type,
      });
    });
  });

  return lines;
}
