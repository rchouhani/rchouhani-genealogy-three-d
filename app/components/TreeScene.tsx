"use client";

import * as THREE from 'three';
import { useEffect, useRef } from "react";
import { setupScene } from "../lib/setupScene";
import { Person, Line } from '../types/family';
import { createFamilyData } from "../lib/createFamilyData";
import { createNodes } from "../lib/createNodes";
import { createLinks } from "../lib/createLinks";
import {
  handleHover,
  handleClick,
  handleReset,
  handleResize,
} from "../lib/eventHandlers";

export default function TreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const { scene, camera, renderer, controls } = setupScene(mountRef.current!);
    const familyData: Person[] = createFamilyData();

    const points: THREE.Mesh[] = createNodes(familyData, { scene, camera, renderer, controls });
    const lines: Line[] = createLinks(familyData, points, { scene, camera, renderer, controls });

    const selectedIds = new Set<number>();
    const tooltipElement = tooltipRef.current!;

    const onMouseMove = (event: MouseEvent) => handleHover(event, camera, points, tooltipElement);
    const onClick = (event: MouseEvent) => handleClick(event, camera, points, lines, familyData, selectedIds);
    const onKeyDown = (event: KeyboardEvent) => { if (event.key === "r") handleReset(camera, controls)};

    window.addEventListener("mousemove", onMouseMove);
    window.addEventListener("click", onClick);
    window.addEventListener("keydown", onKeyDown);

    const cleanupResize = handleResize(camera, renderer);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      window.addEventListener("mousemove", onMouseMove);
      window.addEventListener("click", onClick);
      window.addEventListener("keydown", onKeyDown);
      cleanupResize();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  return (
    <div className="relative w-full h-screen bg-black">
      <div ref={mountRef} className="w-full h-full" />
      <div 
      ref={tooltipRef}
      id="tooltip"
      className="absolute hidden bg-gray-800 text-white text-sm px-2 py-1 rounded pointer-events-none"
      style={{
        transition: "opacity 0.2s ease",
        zIndex: 10,
      }} />
    </div>
  );
};
