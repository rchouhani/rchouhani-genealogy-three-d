import * as THREE from "three";
import { Line, Person } from "../types/family";
import showConnections from "./bfs";

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

// Gestion du click sur les points ainsi que l'affcihage qui va avec
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

// Gestion de la remise à zéro de la scène
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
