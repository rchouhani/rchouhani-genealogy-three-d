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
  camera.position.set(0, 10, 50); // y=10 au lieu de 0
  camera.lookAt(0, -6, 0); // regarde vers le milieu de l'arbre (génération 1)

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  container?.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.enableZoom = true;
  controls.target.set(0, -6, 0); // centre de rotation au milieu de l'arbre

  return { scene, camera, renderer, controls };
}