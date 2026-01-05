import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { Line, Person } from "../types/family";
import showConnections from "./bfs";

// === Instanciation unique du raycaster et de la souris ===
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// === Gestion du survol ===
export function handleHover(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  points: THREE.Mesh[]
) {
  // TODO Phase 1: mutualiser le tooltip (singleton) pour éviter les recréations DOM

  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.background = "rgba(0,0,0,0.7)";
  tooltip.style.color = "white";
  tooltip.style.padding = "4px 8px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.display = "none";
  tooltip.style.zIndex = "1000";
  tooltip.style.whiteSpace = "nowrap";
  document.body.appendChild(tooltip);

  const onMouseMove = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();

    // Normalisation en tenant compte du canvas et non de la fenêtre
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(points);

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      document.body.style.cursor = "pointer";

      tooltip.style.display = "block";
      tooltip.textContent = intersected.userData?.firstName
        ? `${intersected.userData.firstName} ${intersected.userData.lastName}`
        : intersected.userData?.name || "inconnu";

      // Position du tooltip
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
    } else {
      document.body.style.cursor = "default";
      tooltip.style.display = "none";
    }
  };

  renderer.domElement.addEventListener("mousemove", onMouseMove);

  return () => {
    renderer.domElement.removeEventListener("mousemove", onMouseMove);
    document.body.removeChild(tooltip);
  };
}

// Gestion du click sur les points ainsi que l'affcihage qui va avec
export function handleClick(
  renderer: THREE.WebGLRenderer,
  scene: THREE.Scene,
  camera: THREE.Camera,
  points: THREE.Mesh[],
  lines: Line[],
  familyData: Person[]
) {
  const selectedIds = new Set<number>();

  const onClick = (event: MouseEvent) => {
const rect = renderer.domElement.getBoundingClientRect();
mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;


    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(points);

    if (intersects.length === 0) return;

    const clicked = intersects[0].object;
    const clickedId = clicked.userData.id;

    if (!selectedIds.has(clickedId)) selectedIds.add(clickedId);

    showConnections(clickedId, lines, familyData);
  };

  renderer.domElement.addEventListener("click", onClick);

  return () => {
    renderer.domElement.removeEventListener("click", onClick);
  };
}

// gestion du reset de la scène avec le bouton reset
export function resetView(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls, // OrbitControls
  lines?: Line[]
) {
  console.log("resetView called", {
    linesCount: lines?.length ?? "no-lines",
    linesRef: lines,
  });

  controls.reset();
  camera.position.set(0, 0, 50);
  controls.target.set(0, 0, 0);
  controls.update();

  if (lines && Array.isArray(lines)) {
    lines.forEach((l) => {
      l.line.visible = false;
    });
  }
}

// Gestion de la touche "r" pour le reset avec le clavier
export function attachResetKeyListener(
  camera: THREE.PerspectiveCamera,
  getLines: () => Line[] | undefined,
  controls: OrbitControls
) {
  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "r") {
      const lines = getLines();
      resetView(camera, controls, lines);
    }
  };

  window.addEventListener("keydown", onKeyPress);
  return () => window.removeEventListener("keydown", onKeyPress);
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

  renderer.domElement.addEventListener("resize", onResize);

  return () => {
    renderer.domElement.removeEventListener("resize", onResize);
  };
}
