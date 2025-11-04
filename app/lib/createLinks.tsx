import * as THREE from "three";
import { Person, Line } from "../types/family";

export function createLinks(
  scene: THREE.Scene,
  familyData: Person[],
  points: THREE.Mesh[]
): Line[] {
  const lines: Line[] = [];

  familyData.forEach((person) => {
    person.relations.forEach((rel) => {
      // We create links for all relation types if you want; keep as needed
      // find points by userData.id
      const from = points.find((p) => p.userData?.id === person.id);
      const to = points.find((p) => p.userData?.id === rel.id);

      if (!from || !to) return;

      // prevent duplicate lines
      const exists = lines.some(
        (l) =>
          (l.parent === person.id && l.child === rel.id) ||
          (l.parent === rel.id && l.child === person.id)
      );
      if (exists) return;

      const color =
        rel.type === "child"
          ? 0x00ff00
          : rel.type === "parent"
          ? 0xff0000
          : rel.type === "sibling"
          ? 0xffff00
          : 0x00ffff;

      const material = new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.9 });

      // Use world positions snapshot — clone vectors so the geometry keeps coordinates even if later moved
      const pFrom = new THREE.Vector3().copy(from.position);
      const pTo = new THREE.Vector3().copy(to.position);

      const geometry = new THREE.BufferGeometry().setFromPoints([pFrom, pTo]);

      const line = new THREE.Line(geometry, material);
      line.visible = false; // hidden initially
      scene.add(line);

      lines.push({ parent: person.id, child: rel.id, line });
    });
  });

  return lines;
}
