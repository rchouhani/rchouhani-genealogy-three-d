/**
 * @fileoverview Types liés au rendu Three.js.
 *
 * Ces types ne sont utilisés que par les fichiers qui touchent à la scène 3D.
 * Ils sont séparés de family.ts pour que les types métier restent purs
 * et réutilisables sans importer Three.js.
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { RelationType } from "../utils/generation";

// ---------------------------------------------------------------------------
// Scène
// ---------------------------------------------------------------------------

/**
 * Ensemble des objets Three.js créés lors de l'initialisation de la scène.
 * Passé en ref dans TreeScene pour être accessible sans re-render.
 */
export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}

// ---------------------------------------------------------------------------
// Ligne (trait entre deux points)
// ---------------------------------------------------------------------------

/**
 * Représentation d'un trait visuel entre deux personnes dans la scène.
 *
 * @property sourceId  - ID de la personne source du trait.
 * @property targetId  - ID de la personne cible du trait.
 * @property line      - Objet Three.Line correspondant dans la scène.
 * @property type      - Nature de la relation (utilisé pour le tooltip au hover).
 *
 * Nommage volontaire : `sourceId` / `targetId` et non `parent` / `child`,
 * parce qu'un trait peut aussi représenter un conjoint ou un sibling.
 */
export interface LineObject {
  sourceId: string;
  targetId: string;
  line: THREE.Line;
  type: RelationType; // les 34 types détaillés, pas les 4 catégories de base
}

// ---------------------------------------------------------------------------
// Hitbox (cylindre invisible pour la détection hover sur les traits)
// ---------------------------------------------------------------------------

/**
 * Cylindre invisible positionné sur un trait pour permettre
 * la détection au survol via le raycaster.
 *
 * Pourquoi : THREE.Line n'est pas fiablement détecté par intersectObjects().
 * Solution : un CylinderGeometry transparent, légèrement plus large que
 * le trait, sert de zone de détection.
 *
 * @property mesh      - Le cylindre Three.js invisible.
 * @property sourceId  - ID de la personne source.
 * @property targetId  - ID de la personne cible.
 * @property type      - Type de relation (pour le tooltip).
 */
export interface HitboxObject {
  mesh: THREE.Mesh;
  sourceId: string;
  targetId: string;
  type: RelationType; // les 34 types détaillés, pas les 4 catégories de base
}

/**
 * Résultat retourné par createLinks.
 * Sépare clairement les objets visuels (lines) des objets d'interaction (hitboxes).
 */
export interface CreateLinksResult {
  lines: LineObject[];
  hitboxes: HitboxObject[];
}

// ---------------------------------------------------------------------------
// Filtres de relations
// ---------------------------------------------------------------------------

/**
 * Catégories de relations pour le filtrage.
 */
export type RelationFilterCategory =
  | "proches"                  // Mes proches (parents, enfants, fratrie, conjoint)
  | "elargie"                  // Famille élargie (oncles/tantes, cousins, neveux/nièces)
  | "recomposee"               // Famille recomposée (beaux-parents, demi-frères/sœurs)
  | "parAlliance"              // Par alliance (beaux-frères/sœurs, gendres/brus)
  | "intergenerationnel";      // Intergénérationnel (grands-parents, petits-enfants, etc.)

/**
 * État des filtres actifs.
 * Si tous sont false, "proches" est appliqué par défaut.
 */
export interface RelationFilters {
  proches: boolean;
  elargie: boolean;
  recomposee: boolean;
  parAlliance: boolean;
  intergenerationnel: boolean;
}

// ---------------------------------------------------------------------------
// Props des composants UI liés à la scène
// ---------------------------------------------------------------------------

/**
 * Props du panneau de contrôles (zoom, freeze, reset).
 *
 * @property onFreeze - Toggle le freeze de la scène.
 * @property isFrozen - État actuel du freeze (pour l'affichage du bouton).
 */
export interface ControlsPanelProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFreeze: () => void;
  onReset: () => void;
  onAddMember: () => void;
  isFrozen: boolean;
}
