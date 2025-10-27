import * as THREE from "three";

export interface Relation {
  id: number;
  type: "child" | "parent" | "sibling";
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
  type: string;
  line: THREE.Line;
}
