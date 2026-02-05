/**
 * @fileoverview Gestion des événements d'interaction avec la scène 3D.
 *
 * Ce fichier contient tous les handlers d'événements pour :
 *   - Hover sur les points (affichage tooltip)
 *   - Click sur les points (sélection + affichage connexions)
 *   - Reset de la vue (bouton + touche "r")
 *   - Resize de la fenêtre
 *
 * Règles strictes :
 *   - Normalisation identique pour hover et click (getBoundingClientRect).
 *   - Tous les listeners sur renderer.domElement (sauf resize et keydown sur window).
 *   - Cleanup systématique retourné.
 *   - Une seule instance de raycaster et mouse (module scope).
 */

import * as THREE from "three";
import { LineObject } from "../types/scene";
import { Person } from "../types/family";
import showConnections from "./bfs";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Raycaster et vecteur mouse partagés (module scope)
// Évite de recréer ces objets à chaque frame
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// ---------------------------------------------------------------------------
// HOVER
// ---------------------------------------------------------------------------

/**
 * Gère l'affichage d'un tooltip au survol des points.
 *
 * Le tooltip affiche le prénom + nom de la personne.
 * Il suit le curseur et disparaît quand on quitte le point.
 *
 * @param renderer - Renderer Three.js (pour écouter sur son domElement).
 * @param camera   - Caméra utilisée pour le raycasting.
 * @param points   - Liste des meshes (points) à tester.
 * @returns Fonction de cleanup (removeEventListener + removeChild du tooltip).
 */
export function handleHover(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  points: THREE.Mesh[]
) {
  // Création du tooltip
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

    // Normalisation en tenant compte du canvas (pas de window.innerWidth)
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
        : "Inconnu";

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

// ---------------------------------------------------------------------------
// CLICK
// ---------------------------------------------------------------------------

/**
 * Gère le click sur les points.
 *
 * Quand un point est cliqué :
 *   1. La personne correspondante est sélectionnée (callback onSelectPerson).
 *   2. Les connexions liées à cette personne sont affichées via BFS.
 *
 * @param renderer       - Renderer Three.js (pour écouter sur son domElement).
 * @param camera         - Caméra utilisée pour le raycasting.
 * @param points         - Liste des meshes (points) à tester.
 * @param lines          - Liste des lignes à afficher/cacher.
 * @param familyData     - Données des personnes (pour BFS et lookup).
 * @param onSelectPerson - Callback appelé quand une personne est sélectionnée.
 * @returns Fonction de cleanup (removeEventListener).
 */
export function handleClick(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  points: THREE.Mesh[],
  lines: LineObject[],
  familyData: Person[],
  onSelectPerson: (person: Person, mesh: THREE.Mesh) => void
) {
  const onClick = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();

    // IMPORTANT : même normalisation que handleHover
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(points);

    if (intersects.length === 0) return;

    const mesh = intersects[0].object as THREE.Mesh;
    const clickedId = mesh.userData.id;
    const person = familyData.find((p) => p.id === clickedId);

    if (!person) return;

    // Callback vers TreeScene → page.tsx
    onSelectPerson(person, mesh);

    // Affichage des connexions
    showConnections(clickedId, lines, familyData);
  };

  // IMPORTANT : écoute sur renderer.domElement (pas window)
  renderer.domElement.addEventListener("click", onClick);

  return () => {
    renderer.domElement.removeEventListener("click", onClick);
  };
}

// ---------------------------------------------------------------------------
// RESET
// ---------------------------------------------------------------------------

/**
 * Réinitialise la vue de la caméra et masque toutes les lignes.
 *
 * Appelé par le bouton Reset ou la touche "r".
 *
 * @param camera  - Caméra à réinitialiser.
 * @param controls - OrbitControls à réinitialiser.
 * @param lines    - Liste des lignes à masquer (optionnel).
 */
export function resetView(
  camera: THREE.PerspectiveCamera,
  controls: OrbitControls,
  lines?: LineObject[]
) {
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

/**
 * Attache un listener sur la touche "r" pour reset.
 *
 * @param camera   - Caméra à réinitialiser.
 * @param getLines - Fonction qui retourne la liste actuelle des lignes.
 * @param controls - OrbitControls à réinitialiser.
 * @returns Fonction de cleanup (removeEventListener).
 */
export function attachResetKeyListener(
  camera: THREE.PerspectiveCamera,
  getLines: () => LineObject[] | undefined,
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

// ---------------------------------------------------------------------------
// RESIZE
// ---------------------------------------------------------------------------

/**
 * Gère le redimensionnement de la fenêtre.
 *
 * Met à jour l'aspect de la caméra et la taille du renderer.
 *
 * @param camera   - Caméra à mettre à jour.
 * @param renderer - Renderer à redimensionner.
 * @returns Fonction de cleanup (removeEventListener).
 */
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
