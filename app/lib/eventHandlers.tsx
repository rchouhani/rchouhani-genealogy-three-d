import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line, Person } from "../types/family";
import showConnections from "../lib/bfs";

// === Instanciation unique du raycaster et de la souris ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// === Gestion du survol ===
export function handleHover(
  camera: THREE.Camera,
  points: THREE.Mesh[],
  tooltip: HTMLElement
) {
  const onMouseMove = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(points);

    document.body.style.cursor = intersects.length > 0 ? "pointer" : "default";

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      tooltip.style.display = "block";
      tooltip.textContent = intersected.userData.name;
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
    } else {
      tooltip.style.display = "none";
    }
  };

  window.addEventListener("mousemove", onMouseMove);
  return () => window.removeEventListener("mousemove", onMouseMove);
}

// === Gestion du clic ===
export function handleClick(
  camera: THREE.Camera,
  points: THREE.Mesh[],
  lines: Line[],
  familyData: Person[],
  selectedIds: Set<number>
) {
  const onClick = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(points);
    if (intersects.length === 0) return;

    const clicked = intersects[0].object;
    const clickedId = clicked.userData.id;

    if (!selectedIds.has(clickedId)) selectedIds.add(clickedId);
    showConnections(clickedId, lines, familyData);
  };

  window.addEventListener("click", onClick);
  return () => window.removeEventListener("click", onClick);
}

// === Gestion du reset ===
export function handleReset(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls
) {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "r" || event.key === "R") {
      controls.reset();
      camera.position.set(0, 0, 50);
      controls.update();
    }
  };

  window.addEventListener("keydown", onKeyDown);
  return () => window.removeEventListener("keydown", onKeyDown);
}

// === Gestion du redimensionnement ===
export function handleResize(
  camera: THREE.PerspectiveCamera,
  renderer: THREE.WebGLRenderer
) {
  const onResize = () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  };

  window.addEventListener("resize", onResize);
  return () => window.removeEventListener("resize", onResize);
}
