import * as THREE from "three";
import { Person, Line } from "../types/family";

export function createLinks(
  scene: THREE.Scene,
  familyData: Person[],
  points: THREE.Mesh[]
): Line[] {
  const lines: Line[] = [];

  familyData.forEach((person) => {
    person.relations
      .filter((rel) => rel.type === "child")
      .forEach((rel) => {
        const from = points.find((p) => p.userData.id === person.id);
        const to = points.find((p) => p.userData.id === rel.id);

        const exists = lines.some(
          (l) =>
            (l.parent === person.id && l.child === rel.id) ||
            (l.parent === rel.id && l.child === person.id)
        );
        if (!from || !to || exists) return;

        const color =
          rel.type === "child"
            ? 0x00ff00
            : rel.type === "parent"
            ? 0xff0000
            : rel.type === "sibling"
            ? 0xffff00
            : 0x00ffff;

        const material = new THREE.LineBasicMaterial({
          color,
          transparent: true,
          opacity: 0.99,
        });

        const geometry = new THREE.BufferGeometry().setFromPoints([
          from.position,
          to.position,
        ]);

        const line = new THREE.Line(geometry, material);
        line.visible = false;
        scene.add(line);

        lines.push({ parent: person.id, child: rel.id, line });
      });
  });

  return lines;
}
