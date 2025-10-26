"use client";

import * as THREE from "three";
import { useEffect, useRef } from "react";
import { setupScene } from "../lib/setupScene";
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

  useEffect(() => {
    const { scene, camera, renderer, controls } = setupScene(mountRef.current!);
    const familyData = createFamilyData();

    const points = createNodes(scene, familyData);
    const lines = createLinks(scene, familyData, points);

    const cleanups = [
      handleHover(renderer, camera, points),
      handleClick(scene, camera, points, lines, familyData),
      handleReset(camera, lines, controls),
      handleResize(camera, renderer),
    ];

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => cleanups.forEach((c) => c());
  }, []);

  return <div ref={mountRef} className="w-full h-screen" />;
}
