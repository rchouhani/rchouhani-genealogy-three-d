/**
 * @fileoverview Création des points (nodes) représentant les personnes.
 *
 * Chaque personne devient une sphère 3D positionnée selon sa génération.
 * Les données de la personne sont stockées dans mesh.userData pour être
 * accessibles lors des interactions (hover, click).
 *
 * @param scene      - Scène Three.js où ajouter les meshes.
 * @param familyData - Liste des personnes à représenter.
 * @returns Liste des meshes créés.
 */

import * as THREE from "three";
import { Person } from "../types/family";

export function createNodes(
  scene: THREE.Scene,
  familyData: Person[]
): THREE.Mesh[] {
  const points: THREE.Mesh[] = [];
  const sphereGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x007bff });

  // Espacements pour le layout
  const spacingX = 8;
  const spacingY = 6;
  const spacingZ = 5;

  familyData.forEach((person, index) => {
    const sphereMat = baseMaterial.clone();
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);

    const gen = typeof person.generation === "number" ? person.generation : 0;

    // Trouver toutes les personnes de la même génération
    const sameGen = familyData.filter((p) => p.generation === gen);

    // Position dans la génération (basée sur l'ID pour stabilité)
    const posInGen = sameGen.findIndex((p) => p.id === person.id);
    const safePosInGen = posInGen >= 0 ? posInGen : index;

    // Calcul de position 3D
    const x = (safePosInGen - sameGen.length / 2) * spacingX;
    const y = -gen * spacingY;
    const z = (index % 2 === 0 ? 1 : -1) * spacingZ;

    sphere.position.set(x, y, z);

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
