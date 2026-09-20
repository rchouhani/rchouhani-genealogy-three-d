import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneSetup } from "../types/scene";

export function setupScene(container: HTMLElement | null): SceneSetup {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    60,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  
  // IMPORTANT : position modifiée pour voir l'arbre qui descend vers le bas
  // ET décalée sur X (pas juste Y/Z) : avec le nouveau système de
  // profondeur réelle (Z représente l'empilement de plusieurs personnes
  // dans une même case colonne+génération), une caméra alignée pile sur
  // X=0 verrait ces personnes exactement superposées à l'écran — leur
  // décalage en Z ne se traduit visuellement en rien tant que le rayon
  // de vue reste parallèle à l'axe Z. Un léger angle latéral (X non nul)
  // rend cette profondeur réellement visible et cliquable séparément.
  camera.position.set(20, 10, 50);
  camera.lookAt(0, -6, 0);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container?.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  // controls.enableRotate = false;
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.target.set(0, -6, 0); // centre de rotation au milieu de l'arbre

  return { scene, camera, renderer, controls };
}
