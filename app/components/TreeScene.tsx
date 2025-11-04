"use client";

import { useEffect, useRef, useState } from "react";
import { setupScene } from "../lib/setupScene";
import { createFamilyData } from "../lib/createFamilyData";
import { createNodes } from "../lib/createNodes";
import { createLinks } from "../lib/createLinks";
import {
  handleHover,
  handleClick,
  handleResize,
  attachResetKeyListener,
  resetView,
} from "../lib/eventHandlers";
import ControlsPanel from "./ControlsPanel";
import { SceneSetup } from "../types/family";

export default function TreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const [sceneObjects, setSceneObjects] = useState<SceneSetup | null>(null);

  useEffect(() => {
    if (!mountRef.current) return;

    const { scene, camera, renderer, controls } = setupScene(mountRef.current);

    setSceneObjects({ scene, camera, renderer, controls });

    const familyData = createFamilyData();
    const points = createNodes(scene, familyData);
    console.log("points.length", points.length);
    points.forEach((p, i) =>
      console.log(i, p.userData?.id, p.userData?.name, p.position.toArray())
    );

    const lines = createLinks(scene, familyData, points);
    console.log("lines.length", lines.length);
    lines.forEach((l) =>
      console.log("line", l.parent, l.child, l.line.visible)
    );

    const cleanupHover = handleHover(renderer, camera, points);
    const cleanupClick = handleClick(scene, camera, points, lines, familyData);
    const cleanupResize = handleResize(camera, renderer);
    const cleanupResetKey = attachResetKeyListener(camera, lines, controls);

    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    return () => {
      cleanupHover && cleanupHover();
      cleanupClick && cleanupClick();
      cleanupResize && cleanupResize();
      cleanupResetKey && cleanupResetKey();

      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  const handleZoomIn = () => {
    if (!sceneObjects) return;
    sceneObjects.camera.position.z -= 5;
  };

  const handleZoomOut = () => {
    if (!sceneObjects) return;
    sceneObjects.camera.position.z += 5;
  };

  const handleResetClick = () => {
    if (!sceneObjects) return;
    resetView(sceneObjects.camera, sceneObjects.controls);
  };

  return (
    <>
      <div ref={mountRef} className="w-full h-screen" />
      <ControlsPanel
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetClick}
      />
    </>
  );
}
