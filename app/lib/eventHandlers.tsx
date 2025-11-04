import * as THREE from "three";
import { Line, Person } from "../types/family";
import showConnections from "./bfs";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// En global pour éviter la recréation
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

export function handleHover(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  points: THREE.Mesh[]
) {
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.background = "rgba(0,0,0,0.75)";
  tooltip.style.color = "#fff";
  tooltip.style.padding = "4px 8px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.fontSize = "12px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.display = "none";
  tooltip.style.zIndex = "1000";
  document.body.appendChild(tooltip);

  const onMouseMove = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(points, false);

    if (intersects.length > 0) {
      document.body.style.cursor = "pointer";
      const intersected = intersects[0].object;
      // DEBUG LOG
      // console.log("hover ->", intersected.userData);

      tooltip.style.display = "block";
      tooltip.textContent = intersected.userData?.name ?? "inconnu";

      const tooltipWidth = tooltip.offsetWidth || 100;
      const tooltipHeight = tooltip.offsetHeight || 20;
      const x = Math.min(
        event.clientX + 12,
        window.innerWidth - tooltipWidth - 10
      );
      const y = Math.min(
        event.clientY + 12,
        window.innerHeight - tooltipHeight - 10
      );
      tooltip.style.left = `${x}px`;
      tooltip.style.top = `${y}px`;
    } else {
      document.body.style.cursor = "default";
      tooltip.style.display = "none";
    }
  };

  // attach to canvas element so mouse coords are relative (renderer.domElement)
  renderer.domElement.addEventListener("mousemove", onMouseMove);
  return () => {
    renderer.domElement.removeEventListener("mousemove", onMouseMove);
    document.body.removeChild(tooltip);
    document.body.style.cursor = "default";
  };
}

// Gestion du click sur les points ainsi que l'affcihage qui va avec
export function handleClick(
  scene: THREE.Scene,
  camera: THREE.Camera,
  points: THREE.Mesh[],
  lines: Line[],
  familyData: Person[]
) {
  const selectedIds = new Set<number>();

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

  return () => {
    window.removeEventListener("click", onClick);
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

// Gestion du redimensionnement de la fenêtre d'apparition de l'objet 3D
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

  return () => {
    window.removeEventListener("resize", onResize);
  };
}
