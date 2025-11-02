import * as THREE from "three";
import { Line, Person } from "../types/family";
import showConnections from "./bfs";

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
  tooltip.style.background = "rgba(0,0,0,0.7)";
  tooltip.style.color = "white";
  tooltip.style.padding = "4px 8px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.display = "none";
  tooltip.style.zIndex = "1000";
  document.body.appendChild(tooltip);

  const onMouseMove = (event: MouseEvent) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = (event.clientY / window.innerHeight) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(points);

    document.body.style.cursor =
      IntersectionObserver.length > 0 ? "pointer" : "default";

    if (intersects.length > 0) {
      const intersected = intersects[0].object;
      tooltip.style.display = "block";
      tooltip.textContent = intersected.userData.name || "inconnu";
      tooltip.style.left = `${event.clientX + 10}px`;
      tooltip.style.top = `${event.clientY + 10}px`;
    } else {
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

// Gestion de la remise à zéro de la scène
export function handleReset(
  camera: THREE.PerspectiveCamera,
  lines: Line[],
  controls: any // OrbitControls
) {
  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "r") {
      controls.reset();
      camera.position.set(0, 0, 50);
      controls.update();

      lines.forEach((lineObj) => {
        lineObj.line.visible = true;
      });
    }
  };

  window.addEventListener("keydown", onKeyPress);

  return () => {
    window.removeEventListener("keydown", onKeyPress);
  };
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
