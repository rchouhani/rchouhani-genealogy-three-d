/**
 * @fileoverview Gestion des événements d'interaction avec la scène 3D.
 *
 * Ce fichier gère :
 *   - Hover sur les points    → tooltip prénom + nom
 *   - Hover sur les traits    → tooltip type de relation (via hitboxes cylindriques)
 *   - Click sur les points    → sélection + affichage connexions BFS
 *   - Reset de la vue         → bouton + touche "r"
 *   - Resize de la fenêtre    → mise à jour caméra + renderer
 *
 * Règles :
 *   - Normalisation identique hover/click via getBoundingClientRect().
 *   - Tous les listeners d'interaction sur renderer.domElement.
 *   - Cleanup systématiquement retourné.
 */

import * as THREE from "three";
import { LineObject, HitboxObject } from "../types/scene";
import { Person } from "../types/family";
import showConnections from "./bfs";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Partagés en module scope — créés une seule fois
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

/**
 * Labels lisibles pour les types de relation.
 * Utilisé dans le tooltip au hover sur les traits.
 */
const RELATION_LABELS: Record<string, string> = {
  parent: "Parent",
  child: "Enfant",
  sibling: "Frère / Sœur",
  spouse: "Conjoint(e)",
};

// ---------------------------------------------------------------------------
// Utilitaire : création du tooltip DOM
// ---------------------------------------------------------------------------

/**
 * Crée et attache un tooltip invisible au body.
 * Retourne une fonction pour le supprimer du DOM.
 */
function createTooltip(): HTMLDivElement {
  const tooltip = document.createElement("div");
  tooltip.style.position = "absolute";
  tooltip.style.background = "rgba(0,0,0,0.75)";
  tooltip.style.color = "white";
  tooltip.style.padding = "4px 10px";
  tooltip.style.borderRadius = "4px";
  tooltip.style.pointerEvents = "none";
  tooltip.style.display = "none";
  tooltip.style.zIndex = "1000";
  tooltip.style.whiteSpace = "nowrap";
  tooltip.style.fontSize = "13px";
  document.body.appendChild(tooltip);
  return tooltip;
}

// ---------------------------------------------------------------------------
// HOVER
// ---------------------------------------------------------------------------

/**
 * Gère le tooltip au survol des points ET des traits.
 *
 * Priorité de détection :
 *   1. Points (personnes) → affiche prénom + nom
 *   2. Hitboxes (traits)  → affiche le type de relation
 *
 * @param renderer  - Renderer Three.js.
 * @param camera    - Caméra pour le raycasting.
 * @param points    - Meshes des personnes.
 * @param hitboxes  - Cylindres invisibles sur les traits.
 * @returns Cleanup (removeEventListener + removeChild tooltip).
 */
export function handleHover(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  points: THREE.Mesh[],
  hitboxes: HitboxObject[]
) {
  const tooltip = createTooltip();
  const hitboxMeshes = hitboxes.map((h) => h.mesh);

  const onMouseMove = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();

    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);

    // --- Priorité 1 : survol d'un point (personne) ---
    const pointIntersects = raycaster.intersectObjects(points);

    if (pointIntersects.length > 0) {
      const obj = pointIntersects[0].object;
      document.body.style.cursor = "pointer";
      tooltip.style.display = "block";
      tooltip.textContent = obj.userData?.firstName
        ? `${obj.userData.firstName} ${obj.userData.lastName}`
        : "Inconnu";
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
      return;
    }

    // --- Priorité 2 : survol d'une hitbox (trait) ---
    const hitboxIntersects = raycaster.intersectObjects(hitboxMeshes);

    if (hitboxIntersects.length > 0) {
      const obj = hitboxIntersects[0].object;
      const relType = obj.userData?.type as string | undefined;
      const label = relType
        ? RELATION_LABELS[relType] ?? relType
        : "Relation";

      document.body.style.cursor = "default";
      tooltip.style.display = "block";
      tooltip.textContent = label;
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
      return;
    }

    // --- Aucune intersection ---
    document.body.style.cursor = "default";
    tooltip.style.display = "none";
  };

  renderer.domElement.addEventListener("mousemove", onMouseMove);

  return () => {
    renderer.domElement.removeEventListener("mousemove", onMouseMove);
    if (tooltip.parentNode) document.body.removeChild(tooltip);
  };
}

// ---------------------------------------------------------------------------
// CLICK
// ---------------------------------------------------------------------------

/**
 * Gère le click sur les points.
 *
 * Au click :
 *   1. La personne est sélectionnée via onSelectPerson.
 *   2. Les connexions BFS sont affichées.
 *
 * @param renderer       - Renderer Three.js.
 * @param camera         - Caméra pour le raycasting.
 * @param points         - Meshes des personnes.
 * @param lines          - Traits (pour BFS).
 * @param familyData     - Données des personnes.
 * @param onSelectPerson - Callback de sélection.
 * @returns Cleanup (removeEventListener).
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

    // Même normalisation que handleHover
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(points);

    if (intersects.length === 0) return;

    const mesh = intersects[0].object as THREE.Mesh;
    const clickedId = mesh.userData.id;
    const person = familyData.find((p) => p.id === clickedId);

    if (!person) return;

    onSelectPerson(person, mesh);
    showConnections(clickedId, lines, familyData);
  };

  renderer.domElement.addEventListener("click", onClick);

  return () => {
    renderer.domElement.removeEventListener("click", onClick);
  };
}

// ---------------------------------------------------------------------------
// RESET
// ---------------------------------------------------------------------------

/**
 * Réinitialise la vue et masque tous les traits.
 *
 * @param camera   - Caméra à réinitialiser.
 * @param controls - OrbitControls à réinitialiser.
 * @param lines    - Traits à masquer (optionnel).
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
 * Touche "r" pour reset.
 *
 * @param camera   - Caméra à réinitialiser.
 * @param getLines - Fonction retournant les lignes actuelles (pattern ref).
 * @param controls - OrbitControls à réinitialiser.
 * @returns Cleanup (removeEventListener).
 */
export function attachResetKeyListener(
  camera: THREE.PerspectiveCamera,
  getLines: () => LineObject[] | undefined,
  controls: OrbitControls
) {
  const onKeyPress = (event: KeyboardEvent) => {
    if (event.key.toLowerCase() === "r") {
      resetView(camera, controls, getLines());
    }
  };

  window.addEventListener("keydown", onKeyPress);
  return () => window.removeEventListener("keydown", onKeyPress);
}

// ---------------------------------------------------------------------------
// RESIZE
// ---------------------------------------------------------------------------

/**
 * Met à jour la caméra et le renderer au redimensionnement.
 *
 * @param camera   - Caméra à mettre à jour.
 * @param renderer - Renderer à redimensionner.
 * @returns Cleanup (removeEventListener).
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
  return () => window.removeEventListener("resize", onResize);
}
