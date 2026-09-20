/**
 * @fileoverview Création des points (nodes) représentant les personnes.
 *
 * Chaque personne devient une sphère 3D positionnée selon sa génération.
 * Les données de la personne sont stockées dans mesh.userData pour être
 * accessibles lors des interactions (hover, click).
 *
 * Positionnement délégué à computeGenerationalLayout() (layoutPositions.ts) :
 * une position FIXE calculée une fois pour toute la famille, indépendante
 * de la personne actuellement "active". Remplace l'ancien calcul inline
 * (index dans un tableau filtré + décalage Z alterné ±5) par la méthode
 * du barycentre, qui regroupe les personnes réellement liées entre elles
 * plutôt que de les positionner selon leur ordre d'apparition en base.
 *
 * Z vient directement de computeGenerationalLayout() : plusieurs personnes
 * partageant la même case (colonne + génération) sont empilées sur Z pour
 * éviter toute superposition exacte à l'écran.
 *
 * @param scene      - Scène Three.js où ajouter les meshes.
 * @param familyData - Liste des personnes à représenter.
 * @returns Liste des meshes créés.
 */

import * as THREE from "three";
import { Person } from "../types/family";
import { computeGenerationalLayout } from "../lib/layoutPositions";

export function createNodes(
  scene: THREE.Scene,
  familyData: Person[]
): THREE.Mesh[] {
  const points: THREE.Mesh[] = [];
  const sphereGeo = new THREE.SphereGeometry(1, 16, 16);
  const baseMaterial = new THREE.MeshBasicMaterial({ 
    color: 0x007bff,
    transparent: true,
    opacity: 1,
   });

   const selfPerson = familyData.find((p) => p.isSelf);
   const layout = computeGenerationalLayout(familyData, selfPerson?.id);

  // Calculé UNE FOIS pour toute la famille, avant la boucle — c'est ce qui
  // garantit que la position de chaque personne est fixe et ne dépend pas
  // de l'ordre de traitement ni d'une personne "active" quelconque.

  familyData.forEach((person) => {
    const sphereMat = baseMaterial.clone();
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);

    // computeGenerationalLayout garantit une entrée pour CHAQUE personne
    // fournie (voir ses tests, section "cas limites") — ce fallback ne
    // devrait donc jamais servir, il protège juste contre une éventuelle
    // incohérence de données plutôt que de planter au rendu.
    const position = layout.get(person.id) ?? { x: 0, y: 0, z: 0 };

    sphere.position.set(position.x, position.y, position.z);

    // IMPORTANT : stockage des données dans userData
    // Utilisé par handleHover et handleClick
    sphere.userData = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      generation: person.generation,
      relations: person.relations,
    };

    scene.add(sphere);
    points.push(sphere);
  });

  return points;
}
