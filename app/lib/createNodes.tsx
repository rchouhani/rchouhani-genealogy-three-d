import * as THREE from "three";
import { Person, SceneSetup } from "../types/family";

export function createNodes(
  familyData: Person[],
  scene: THREE.Scene
): THREE.Mesh[] {
  const points: THREE.Mesh[] = [];

  const sphereGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const sphereMat = new THREE.MeshBasicMaterial({ color: 0x007bff });

  // Voir pour rendre ces valeurs dynamiques et voir les typages des variables
  const spacingX = 8;
  const spacingY = 6;
  const spacingZ = 5;

  familyData.forEach((person, index) => {
    const sphere = new THREE.Mesh(sphereGeo, sphereMat.clone()); // expliquer le .clone
    const gen = person.generation;

    const siblingsAtGen = familyData.filter((p) => p.generation === gen);
    const x =
      (siblingsAtGen.indexOf(person) - siblingsAtGen.length / 2) * spacingX;
    const y = -gen * spacingY;
    const z = (index % 2 === 0 ? 1 : 1) * spacingZ;

    sphere.position.set(x, y, z);
    sphere.userData = person;

    scene.add(sphere);
    points.push(sphere);
  });

  return points;
}
