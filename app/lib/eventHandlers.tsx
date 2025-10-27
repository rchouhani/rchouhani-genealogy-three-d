import * as THREE from "three";
import { Line } from "../types/family";
import { Person } from "../types/family";
// En global pour éviter la recréation
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function handleHover(
  event: MouseEvent,
  camera: THREE.Camera,
  points: THREE.Mesh[],
  tooltip: HTMLElement
) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(points);

  document.body.style.cursor =
    IntersectionObserver.length > 0 ? "pointer" : "default";

  if (intersects.length > 0) {
    const intersected = intersects[0].object;
    tooltip.style.display = "block";
    tooltip.textContent = intersected.userData.name;
    tooltip.style.left = event.clientX + 10 + "px";
    tooltip.style.top = event.clientY + 10 + "px";
  } else {
    tooltip.style.display = "none";
  }
}

export function handleClick(
  event: MouseEvent,
  camera: THREE.Camera,
  points: THREE.Mesh[],
  lines: Line[],
  familyData: Person[],
  selectedIds: Set<number>
) {
  mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
  mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

  raycaster.setFromCamera(mouse, camera);
  const intersects = raycaster.intersectObjects(points);

  if (intersects.length === 0) return;

  const clicked = intersects[0].object;
  const clickedId = clicked.userData.id;

  if (!selectedIds.has(clickedId)) selectedIds.add(clickedId);

  showConnections(clickedId, lines, familyData);
}

function showConnections(startId: number, lines: Line[], familyData: Person[]) {
  const queue = [startId];
  const visited = new Set(queue);
  let count = 0;

  //Masquer toutes les lignes
  lines.forEach((l) => (l.line.visible = false));

  while (queue.length > 0 && count < 10) {
    const currentId = queue.shift()!; // expliquer cette ligne
    const person = familyData.find((p) => p.id === currentId);
    if (!person) continue;

    person.relations.forEach((rel) => {
      if (!visited.has(rel.id) && count < 10) {
        visited.add(rel.id);
        queue.push(rel.id);
        count++;
      }

      // Afficher la ligne correspondante
      lines.forEach((l) => {
        if (
          (l.parent === currentId && l.child === rel.id) ||
          (l.child === currentId && l.parent === rel.id)
        ) {
          l.line.visible = true;
        }
      });
    });
  }
}

export function handleReset(
  camera: THREE.PerspectiveCamera,
  controls: any // OrbitControls
) {
  controls.reset();
  camera.position.set(0, 0, 50);
  controls.update();
}

// Gestion du redimensionnement de la fenêtre d'apparition de l'objet 3D
export function handleResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) {
  window.addEventListener("resize", () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });
}
