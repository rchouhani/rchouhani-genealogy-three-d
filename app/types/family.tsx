import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";

export interface Relation {
  id: number;
  type: "child" | "parent" | "sibling" | "spouse";
}

export interface Person {
  id: number;
  firstName: string;
  lastName: string;
  // birthName: string;
  // Ne pas oublier d'inclure es dates de nasissance et de mort ainsi que leur gestion en back
  // birthDate: Date;
  // deathDate: Date;
  // birthLocation: string;
  // deathLocation: string | undefined;
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

export interface ControlsPanelProps {
  onZoomIn: () => void;
  onZoomOut: () => void;
  onReset: () => void;
}