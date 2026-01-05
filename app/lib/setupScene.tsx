import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { SceneSetup } from "../types/family";

export function setupScene(container: HTMLDivElement): SceneSetup & {
  dispose: () => void;
} {
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    60,
    container.clientWidth / container.clientHeight,
    0.1,
    1000
  );
  camera.position.set(0, 0, 40);

  const renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(window.devicePixelRatio);

  container.appendChild(renderer.domElement);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;
  controls.enablePan = true;
  controls.enableZoom = true;

  let frameId: number | null = null;

  const animate = () => {
    frameId = requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
  };

  // ⚠️ L'animation est volontairement démarrée ici
  animate();

  const dispose = () => {
    if (frameId !== null) {
      cancelAnimationFrame(frameId);
    }

    controls.dispose();
    renderer.dispose();

    if (renderer.domElement.parentNode === container) {
      container.removeChild(renderer.domElement);
    }
  };

  return {
    scene,
    camera,
    renderer,
    controls,
    dispose,
  };
}
