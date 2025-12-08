"use client";

import * as THREE from "three";
import { useEffect, useRef, useState } from "react";
import { setupScene } from "../lib/setupScene";
import { Person, Line, SceneSetup } from '../types/family';
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
import AddMemberForm from "./AddMemberForm";

export default function TreeScene() {
  const mountRef = useRef<HTMLDivElement>(null);
  const pointsRef = useRef<THREE.Mesh[]>([]);
  const linesRef = useRef<Line[]>([]);
  const [sceneObjects, setSceneObjects] = useState<SceneSetup | null>(null);
  const [familyData, setFamilyData] = useState<Person[]>([]);

  useEffect(() => {
    if (!mountRef.current) return;

    // === Initialisation de la scène ===
    const { scene, camera, renderer, controls } = setupScene(mountRef.current);
    setSceneObjects({ scene, camera, renderer, controls });

    // === Données de base ===
    const initialFamily = createFamilyData();
    setFamilyData(initialFamily);

    // === Création des points et liens ===
    const points = createNodes(scene, initialFamily);
    pointsRef.current = points;

    const lines = createLinks(scene, initialFamily, points);
    linesRef.current = lines;

    // === Handlers d’événements ===
    const cleanupHover = handleHover(renderer, camera, pointsRef.current);
    const cleanupClick = handleClick(
      scene,
      camera,
      pointsRef.current,
      linesRef.current,
      familyData
    );
    const cleanupResize = handleResize(camera, renderer);
    const cleanupResetKey = attachResetKeyListener(
      camera,
      () => linesRef.current,
      controls
    );

    // === Animation ===
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // === Nettoyage ===
    return () => {
      cleanupHover && cleanupHover();
      cleanupClick && cleanupClick();
      cleanupResize && cleanupResize();
      cleanupResetKey && cleanupResetKey();

      renderer.dispose();
      mountRef.current?.removeChild(renderer.domElement);
    };
  }, []);

  // === Fonctions pour le panel ===
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
    resetView(sceneObjects.camera, sceneObjects.controls, linesRef.current);
  };

  // === Fonction pour ajouter un membre dynamiquement ===
  const handleAddMember = (newMember: Omit<Person, "id">) => {
    if (!sceneObjects) return;

    // Générer un nouvel ID unique
    const newId = Math.max(...familyData.map((p) => p.id)) + 1;
    const memberWithId: Person = { ...newMember, id: newId };
    setFamilyData((prev) => [...prev, memberWithId]);

    // Créer un nouveau point
    const newSphere = createNodes(sceneObjects.scene, [memberWithId])[0];

    // Mettre à jour userData correctement pour le hover
    newSphere.userData = {
      id: memberWithId.id,
      firstName: memberWithId.firstName,
      lastName: memberWithId.lastName,
      generation: memberWithId.generation,
      relations: memberWithId.relations,
    };

    pointsRef.current.push(newSphere);

    // Créer les liens associés
    const newLines = createLinks(
      sceneObjects.scene,
      [memberWithId],
      pointsRef.current
    );
    linesRef.current.push(...newLines);
  };

  return (
    <>
      <div ref={mountRef} className="w-full h-screen" />
      <ControlsPanel
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onReset={handleResetClick}
      />
      <div className="absolute top-5 left-5 bg-white p-4 rounded shadow">
        <AddMemberForm
          familyMembers={familyData}
          onAddMember={handleAddMember}
        />
      </div>
    </>
  );
}
