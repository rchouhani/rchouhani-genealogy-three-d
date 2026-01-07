import * as THREE from "three";
import { Person } from "../types/family";

export function createNodes(
  scene: THREE.Scene,
  familyData: Person[]
): THREE.Mesh[] {
  const points: THREE.Mesh[] = [];

  const sphereGeo = new THREE.SphereGeometry(0.6, 16, 16);
  const baseMaterial = new THREE.MeshBasicMaterial({ color: 0x007bff });

  const spacingX = 8;
  const spacingY = 6;
  const spacingZ = 5;

  familyData.forEach((person, index) => {
    const sphereMat = baseMaterial.clone();
    const sphere = new THREE.Mesh(sphereGeo, sphereMat);

    const gen = typeof person.generation === "number" ? person.generation : 0;
    const sameGen = familyData.filter((p) => p.generation === gen);
    // findIndex by id is robust
    const posInGen = sameGen.findIndex((p) => p.id === person.id);
    // fallback if not found
    const safePosInGen = posInGen >= 0 ? posInGen : index;

    const x = (safePosInGen - sameGen.length / 2) * spacingX;
    const y = -gen * spacingY;
    const z = (index % 2 === 0 ? 1 : -1) * spacingZ;

    sphere.position.set(x, y, z);

    // IMPORTANT: set userData on the mesh (not on geometry)
    sphere.userData = {
      id: person.id,
      firstName: person.firstName,
      lastName: person.lastName,
      status: person.status,
      generation: person.generation,
      relations: person.relations,
    };

    scene.add(sphere);
    points.push(sphere);
  });

  return points;
}
