/**
 * @fileoverview Création des liens visuels et des hitboxes d'interaction.
 *
 * Pour chaque relation dans familyData, deux objets sont créés :
 *   1. Une THREE.Line visible (le trait coloré selon le type de relation).
 *   2. Un CylinderMesh invisible (la hitbox pour le raycaster).
 *
 * Pourquoi des hitboxes :
 *   THREE.Line n'est quasiment pas détecté par intersectObjects() du raycaster.
 *   Un cylindre transparent positionné sur le trait résout ce problème
 *   de façon propre et fiable.
 *
 * Couleurs des traits par type de relation :
 *   - parent  : rouge   (0xff4444)
 *   - child   : vert    (0x44ff44)
 *   - sibling : jaune   (0xffff44)
 *   - spouse  : cyan    (0x44ffff)
 */

import * as THREE from "three";
import { Person } from "../types/family";
import { LineObject, HitboxObject, CreateLinksResult } from "../types/scene";

/** Rayon du cylindre hitbox — assez large pour être cliquable, invisible. */
const HITBOX_RADIUS = 0.4;

/**
 * Calcule la position centrale, la longueur et l'orientation
 * d'un cylindre entre deux points 3D.
 *
 * @param from - Position de départ.
 * @param to   - Position d'arrivée.
 * @returns Position centrale, longueur, et quaternion d'orientation.
 */
function computeCylinderTransform(
  from: THREE.Vector3,
  to: THREE.Vector3
): { center: THREE.Vector3; length: number; quaternion: THREE.Quaternion } {
  const center = new THREE.Vector3().addVectors(from, to).multiplyScalar(0.5);
  const length = from.distanceTo(to);

  // Le cylindre Three.js est orienté le long de l'axe Y par défaut.
  // On calcule la rotation pour l'aligner sur le vecteur from→to.
  const direction = new THREE.Vector3().subVectors(to, from).normalize();
  const up = new THREE.Vector3(0, 1, 0);
  const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);

  return { center, length, quaternion };
}

/**
 * Crée les traits visuels et les hitboxes pour toutes les relations.
 *
 * @param scene      - Scène Three.js où ajouter les objets.
 * @param familyData - Données des personnes et leurs relations.
 * @param points     - Meshes des personnes (pour récupérer les positions).
 * @returns { lines, hitboxes } — traits visuels et cylindres de détection.
 */
export function createLinks(
  scene: THREE.Scene,
  familyData: Person[],
  points: THREE.Mesh[]
): CreateLinksResult {
  const lines: LineObject[] = [];
  const hitboxes: HitboxObject[] = [];

  familyData.forEach((person) => {
    person.relations.forEach((rel) => {
      const fromMesh = points.find((p) => p.userData?.id === person.id);
      const toMesh = points.find((p) => p.userData?.id === rel.targetId);

      if (!fromMesh || !toMesh) return;

      // Éviter les doublons (relation bidirectionnelle)
      const exists = lines.some(
        (l) =>
          (l.sourceId === person.id && l.targetId === rel.targetId) ||
          (l.sourceId === rel.targetId && l.targetId === person.id)
      );

      if (exists) return;

      const pFrom = new THREE.Vector3().copy(fromMesh.position);
      const pTo = new THREE.Vector3().copy(toMesh.position);

      // --- Trait visuel ---
      const color =
        rel.type === "child"
          ? 0x44ff44
          : rel.type === "parent"
          ? 0xff4444
          : rel.type === "sibling"
          ? 0xffff44
          : 0x44ffff; // spouse

      const lineMaterial = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity: 0.6,
      });

      const lineGeometry = new THREE.BufferGeometry().setFromPoints([pFrom, pTo]);
      const line = new THREE.Line(lineGeometry, lineMaterial);
      line.visible = true;
      scene.add(line);

      lines.push({
        sourceId: person.id,
        targetId: rel.targetId,
        line,
        type: rel.type,
      });

      // --- Hitbox cylindrique invisible ---
      const { center, length, quaternion } = computeCylinderTransform(pFrom, pTo);

      const hitboxGeo = new THREE.CylinderGeometry(
        HITBOX_RADIUS,
        HITBOX_RADIUS,
        length,
        8
      );
      const hitboxMat = new THREE.MeshBasicMaterial({
        transparent: true,
        opacity: 0,
        depthWrite: false,
      });

      const hitboxMesh = new THREE.Mesh(hitboxGeo, hitboxMat);
      hitboxMesh.position.copy(center);
      hitboxMesh.quaternion.copy(quaternion);

      // Données de relation stockées pour le tooltip au hover
      hitboxMesh.userData = {
        isHitbox: true,
        sourceId: person.id,
        targetId: rel.targetId,
        type: rel.type,
      };

      scene.add(hitboxMesh);

      hitboxes.push({
        mesh: hitboxMesh,
        sourceId: person.id,
        targetId: rel.targetId,
        type: rel.type,
      });
    });
  });

  return { lines, hitboxes };
}
