"use client";
/* VERSION OK */
import * as THREE from "three";
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
import { SceneSetup, Line, Person } from "../types/family";

interface TreeSceneProps {
  selectedPerson: Person | null;
  familyData: Person[];
}

export default function TreeScene({ selectedPerson, familyData }: TreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<THREE.Mesh[]>([]);
  const linesRef = useRef<Line[]>([]);
  const sceneObjectsRef = useRef<SceneSetup | null>(null);

  // On initialise la scène une seule fois
  useEffect(() => {
    if (!mountRef.current) return;

    const { scene, camera, renderer, controls } = setupScene(mountRef.current);
    sceneObjectsRef.current = { scene, camera, renderer, controls };

    // Création initiale des points et liens
    const points = createNodes(scene, familyData);
    pointsRef.current = points;

    const lines = createLinks(scene, familyData, points);
    linesRef.current = lines;

    // Handlers
    const cleanupHover = handleHover(renderer, camera, pointsRef.current);
    const cleanupClick = handleClick(scene, camera, pointsRef.current, linesRef.current, familyData);
    const cleanupResize = handleResize(camera, renderer);
    const cleanupResetKey = attachResetKeyListener(camera, () => linesRef.current, controls);

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

  // Fonction pour ajouter dynamiquement un membre
  const handleAddMember = (newMember: Omit<Person, "id">) => {
    if (!sceneObjectsRef.current) return;

    const newId = Math.max(...familyData.map((p) => p.id)) + 1;
    const memberWithId: Person = { ...newMember, id: newId };

    // Ajouter point
    const newPoint = createNodes(sceneObjectsRef.current.scene, [memberWithId])[0];
    newPoint.userData = {
      id: memberWithId.id,
      name: memberWithId.firstName,
      generation: memberWithId.generation,
      relations: memberWithId.relations,
    };
    pointsRef.current.push(newPoint);

    // Ajouter liens
    const newLines = createLinks(sceneObjectsRef.current.scene, [memberWithId], pointsRef.current);
    linesRef.current.push(...newLines);

    // Réattacher hover et click pour inclure le nouveau point
    handleHover(sceneObjectsRef.current.renderer, sceneObjectsRef.current.camera, pointsRef.current);
    handleClick(sceneObjectsRef.current.scene, sceneObjectsRef.current.camera, pointsRef.current, linesRef.current, [...familyData, memberWithId]);
  };

  const handleZoomIn = () => {
    if (!sceneObjectsRef.current) return;
    sceneObjectsRef.current.camera.position.z -= 5;
  };

  const handleZoomOut = () => {
    if (!sceneObjectsRef.current) return;
    sceneObjectsRef.current.camera.position.z += 5;
  };

  const handleResetClick = () => {
    if (!sceneObjectsRef.current) return;
    resetView(sceneObjectsRef.current.camera, sceneObjectsRef.current.controls, linesRef.current);
  };

  return (
    <>
      <div ref={mountRef} className="w-full h-screen" />
      <ControlsPanel onZoomIn={handleZoomIn} onZoomOut={handleZoomOut} onReset={handleResetClick} />
    </>
  );
}
