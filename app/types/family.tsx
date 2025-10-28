import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface Relation {
  id: number;
  type: "child" | "parent" | "sibling" | "spouse";
}

export interface Person {
  id: number;
  name: string;
  generation: number;
  relations: Relation[];
}

export interface Line {
  parent: number;
  child: number;
  line: THREE.Line;
}

export interface SceneSetup {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  renderer: THREE.WebGLRenderer;
  controls: OrbitControls;
}