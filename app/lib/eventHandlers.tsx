import React from "react";
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
import { computeBloodTreeIds } from "./bloodTree";
import { OpacityAnimator } from "./opacityAnimator";
import showConnections from "./bfs";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

// Partagés en module scope — créés une seule fois
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

const HOVER_PREVIEW_OPACITY = 0.4;
const HOVER_POINT_FADE_DURATION_MS = 300;
const HOVER_LINE_FADE_DURATION_MS = 300;
/** Délai entre l'apparition des points et celle des relations — l'effet
 * "échelonné" demandé : on voit d'abord QUI apparaît, puis COMMENT ils
 * sont reliés. */
const HOVER_LINE_STAGGER_DELAY_MS = 200;
/**
 * Labels lisibles pour les types de relation.
 * Utilisé dans le tooltip au hover sur les traits.
 */
const RELATION_LABELS: Record<string, string> = {
  // Mes proches
  parent: "Parent",
  mother: "Mère",
  father: "Père",
  child: "Enfant",
  son: "Fils",
  daughter: "Fille",
  sibling: "Frère / Sœur",
  brother: "Frère",
  sister: "Sœur",
  spouse: "Conjoint(e)",
  wife: "Épouse",
  husband: "Époux",

  // Famille élargie
  uncle: "Oncle",
  aunt: "Tante",
  cousin: "Cousin(e)",
  nephew: "Neveu",
  niece: "Nièce",

  // Famille recomposée
  stepFather: "Beau-père",
  stepMother: "Belle-mère",
  stepBrother: "Demi-frère",
  stepSister: "Demi-sœur",

  // Par alliance
  brotherInLaw: "Beau-frère",
  sisterInLaw: "Belle-sœur",
  sonInLaw: "Gendre",
  daughterInLaw: "Belle-fille",

  // Intergénérationnel
  grandFather: "Grand-père",
  grandMother: "Grand-mère",
  grandParent: "Grand-parent",
  grandChild: "Petit-enfant",
  grandUncle: "Grand-oncle",
  grandAunt: "Grand-tante",
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
  // "fixed" et non "absolute" : le tooltip est positionné avec
  // event.clientX/clientY, qui sont des coordonnées VIEWPORT (indépendantes
  // du scroll). "absolute" se positionne par rapport au document entier et
  // se décale dès que la page scrolle, même légèrement — ce qui donnait
  // l'impression que le tooltip "s'éloigne" du curseur.
  tooltip.style.position = "fixed";
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
 * @param renderer            - Renderer Three.js.
 * @param camera              - Caméra pour le raycasting.
 * @param points              - Meshes des personnes.
 * @param lines               - Traits visuels (pour animer leur opacité).
 * @param hitboxes            - Cylindres invisibles (traits, pour le tooltip).
 * @param familyData          - Toutes les personnes (pour calculer l'arbre de sang).
 * @param animator            - Animateur d'opacité partagé, tické dans TreeScene.
 * @param onHoverPersonChange - Appelé avec la personne survolée, ou null
 *                              quand la souris quitte tout point.
 */
export function handleHover(
  renderer: THREE.WebGLRenderer,
  camera: THREE.Camera,
  points: THREE.Mesh[],
  lines: LineObject[],
  hitboxes: HitboxObject[],
  familyData: Person[],
  animator: OpacityAnimator,
  onHoverPersonChange: (
    person: Person | null,
    screenPosition?: { x: number; y: number }
  ) => void
) {
  const tooltip = createTooltip();
  const hitboxMeshes = hitboxes.map((h) => h.mesh);
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
 
  // Id de la personne actuellement survolée (null si aucune) — permet de
  // détecter un CHANGEMENT (et non un survol continu de la même personne,
  // qui ne doit pas relancer l'animation à chaque mousemove).
  let currentHoverId: string | null = null;
 
  // Délai de grâce avant de considérer qu'on a VRAIMENT quitté le point.
  // Sans ça, le raycaster perd/retrouve l'intersection plusieurs fois par
  // seconde pile à la frontière de la sphère (imprécision normale du
  // raycasting), ce qui redéclenchait sans arrêt entrée/sortie de survol
  // et faisait "s'emballer" la rotation caméra. Annulé si la souris
  // revient sur le point avant l'expiration du délai.
  const HOVER_LEAVE_DEBOUNCE_MS = 150;
  let hoverLeaveTimeout: ReturnType<typeof setTimeout> | null = null;
 
  /** Revient à l'état normal les points/lignes de l'arbre de sang donné. */
  function fadeOutBloodTree(personId: string) {
    const bloodIds = computeBloodTreeIds(personId, familyData);
    const now = performance.now();
 
    points.forEach((mesh) => {
      if (bloodIds.has(mesh.userData?.id) && mesh.userData?.id !== personId) {
        const mat = mesh.material as THREE.Material & { opacity: number };
        animator.queue(mat, 1, {
          delayMs: 0,
          durationMs: HOVER_POINT_FADE_DURATION_MS,
          nowMs: now,
        });
      }
    });
 
    lines.forEach((lineObj) => {
      if (bloodIds.has(lineObj.sourceId) && bloodIds.has(lineObj.targetId)) {
        const mat = lineObj.line.material as THREE.Material & {
          opacity: number;
        };
        animator.queue(mat, 0.6, {
          delayMs: 0,
          durationMs: HOVER_LINE_FADE_DURATION_MS,
          nowMs: now,
        });
      }
    });
  }
 
  /** Fait apparaître en fondu l'arbre de sang de la personne survolée. */
  function fadeInBloodTree(personId: string) {
    const bloodIds = computeBloodTreeIds(personId, familyData);
    const now = performance.now();
 
    points.forEach((mesh) => {
      if (bloodIds.has(mesh.userData?.id) && mesh.userData?.id !== personId) {
        const mat = mesh.material as THREE.Material & { opacity: number };
        animator.queue(mat, HOVER_PREVIEW_OPACITY, {
          delayMs: 0,
          durationMs: HOVER_POINT_FADE_DURATION_MS,
          nowMs: now,
        });
      }
    });
 
    lines.forEach((lineObj) => {
      if (bloodIds.has(lineObj.sourceId) && bloodIds.has(lineObj.targetId)) {
        const mat = lineObj.line.material as THREE.Material & {
          opacity: number;
        };
        // Décalé de HOVER_LINE_STAGGER_DELAY_MS : c'est ce délai qui crée
        // l'effet "points d'abord, relations ensuite" demandé.
        animator.queue(mat, HOVER_PREVIEW_OPACITY, {
          delayMs: HOVER_LINE_STAGGER_DELAY_MS,
          durationMs: HOVER_LINE_FADE_DURATION_MS,
          nowMs: now,
        });
      }
    });
  }
 
  const onMouseMove = (event: MouseEvent) => {
    const rect = renderer.domElement.getBoundingClientRect();
 
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
 
    raycaster.setFromCamera(mouse, camera);
 
    const pointIntersects = raycaster.intersectObjects(points);
 
    if (pointIntersects.length > 0) {
      const obj = pointIntersects[0].object;
      const hoveredId = obj.userData?.id as string | undefined;
 
      document.body.style.cursor = "pointer";
      tooltip.style.display = "block";
      tooltip.textContent = obj.userData?.firstName
        ? `${obj.userData.firstName} ${obj.userData.lastName}`
        : "Inconnu";
      tooltip.style.left = `${event.clientX + 12}px`;
      tooltip.style.top = `${event.clientY + 12}px`;
 
      // On est de nouveau (ou toujours) sur un point : annule toute
      // sortie programmée, peu importe qu'elle concerne la même
      // personne ou une autre.
      if (hoverLeaveTimeout) {
        clearTimeout(hoverLeaveTimeout);
        hoverLeaveTimeout = null;
      }
 
      // Changement de personne survolée : referme/rouvre proprement.
      if (hoveredId && hoveredId !== currentHoverId) {
        if (currentHoverId) fadeOutBloodTree(currentHoverId);
        fadeInBloodTree(hoveredId);
        currentHoverId = hoveredId;
 
        const person = familyData.find((p) => p.id === hoveredId) ?? null;
        onHoverPersonChange(person, { x: event.clientX, y: event.clientY });
      }
      return;
    }
 
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
 
      // Survoler un trait compte comme "toujours dans la zone" : annule
      // aussi une sortie programmée (évite un flicker point↔trait adjacent).
      if (hoverLeaveTimeout) {
        clearTimeout(hoverLeaveTimeout);
        hoverLeaveTimeout = null;
      }
      return;
    }
 
    // --- Aucune intersection : programme une sortie, pas immédiate ---
    document.body.style.cursor = "default";
    tooltip.style.display = "none";
 
    if (currentHoverId && !hoverLeaveTimeout) {
      const idToLeave = currentHoverId;
      hoverLeaveTimeout = setTimeout(() => {
        fadeOutBloodTree(idToLeave);
        currentHoverId = null;
        hoverLeaveTimeout = null;
        onHoverPersonChange(null);
      }, HOVER_LEAVE_DEBOUNCE_MS);
    }
  };
 
  renderer.domElement.addEventListener("mousemove", onMouseMove);
 
  return () => {
    renderer.domElement.removeEventListener("mousemove", onMouseMove);
    if (hoverLeaveTimeout) clearTimeout(hoverLeaveTimeout);
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
  onSelectPerson: (person: Person, mesh: THREE.Mesh) => void,
  isFrozenRef: React.RefObject<boolean>
) {
  const onClick = (event: MouseEvent) => {
    // Interactions désactivées si la scène est figée
    if (isFrozenRef.current) return;

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