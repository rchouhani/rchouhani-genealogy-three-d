/**
 * @fileoverview Initialisation de la scène Three.js.
 *
 * Cette fonction crée et configure les objets Three.js (scene, camera, renderer, controls).
 * Elle NE lance PAS de boucle d'animation — c'est TreeScene qui s'en charge.
 *
 * Responsabilités :
 *   - Créer la scène avec un fond noir.
 *   - Créer la caméra avec une position initiale.
 *   - Créer le renderer et l'attacher au DOM.
 *   - Créer les OrbitControls.
 *
 * Ce qui n'est PAS fait ici :
 *   - Lancer requestAnimationFrame (déjà fait dans TreeScene).
 *   - Créer des points ou des lignes (fait dans createNodes et createLinks).
 */

import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneSetup } from "../types/scene";

/**
 * Initialise et retourne les objets Three.js de base.
 *
 * @param container - Élément DOM où le renderer sera attaché.
 * @returns Les objets scene, camera, renderer, controls.
 */
export function setupScene(container: HTMLElement | null): SceneSetup {
  // Scène
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  // Caméra perspective
  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 50);

  // Renderer
  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container?.appendChild(renderer.domElement);

  // OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.enableZoom = true;

  // IMPORTANT : pas de boucle animate() ici.
  // TreeScene gère requestAnimationFrame + render.

  return { scene, camera, renderer, controls };
}
