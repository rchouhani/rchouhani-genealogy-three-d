"use client";

import * as THREE from "three";
import { useEffect, useRef, useCallback } from "react";
import { setupScene } from "../lib/setupScene";
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
import { Person } from "../types/family";
import { SceneSetup, LineObject, HitboxObject } from "../types/scene";

interface TreeSceneProps {
  familyData: Person[];
  selectedPerson: Person | null;
  onSelectPerson: (person: Person) => void;
}

/**
 * Composant responsable UNIQUEMENT du rendu 3D.
 *
 * Responsabilités :
 *   - Initialiser la scène Three.js une seule fois (mount).
 *   - Recréer les points, liens et hitboxes quand familyData change.
 *   - Gérer les interactions visuelles (hover, click, zoom, reset).
 *   - Nettoyer proprement à l'unmount.
 */
export default function TreeScene({
  familyData,
  selectedPerson,
  onSelectPerson,
}: TreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneSetup | null>(null);
  const pointsRef = useRef<THREE.Mesh[]>([]);
  const linesRef = useRef<LineObject[]>([]);
  const hitboxesRef = useRef<HitboxObject[]>([]);

  const cleanupHoverRef = useRef<(() => void) | null>(null);
  const cleanupClickRef = useRef<(() => void) | null>(null);

  // ---------------------------------------------------------------------------
  // Initialisation de la scène — UNE SEULE FOIS
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!mountRef.current) return;

    const setup = setupScene(mountRef.current);
    sceneRef.current = setup;

    const cleanupResize = handleResize(setup.camera, setup.renderer);
    const cleanupResetKey = attachResetKeyListener(
      setup.camera,
      () => linesRef.current,
      setup.controls
    );

    // Boucle d'animation
    const animate = () => {
      requestAnimationFrame(animate);
      setup.controls.update();
      setup.renderer.render(setup.scene, setup.camera);
    };
    animate();

    return () => {
      cleanupResize();
      cleanupResetKey();
      setup.renderer.dispose();
      if (
        mountRef.current &&
        setup.renderer.domElement.parentNode === mountRef.current
      ) {
        mountRef.current.removeChild(setup.renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Recréation des points, liens et hitboxes à chaque changement de familyData
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const setup = sceneRef.current;
    if (!setup) return;

    // 1. Supprimer les anciens objets de la scène
    pointsRef.current.forEach((mesh) => setup.scene.remove(mesh));
    linesRef.current.forEach((l) => setup.scene.remove(l.line));
    hitboxesRef.current.forEach((h) => setup.scene.remove(h.mesh));

    // 2. Créer les nouveaux objets
    const newPoints = createNodes(setup.scene, familyData);
    const { lines: newLines, hitboxes: newHitboxes } = createLinks(
      setup.scene,
      familyData,
      newPoints
    );

    pointsRef.current = newPoints;
    linesRef.current = newLines;
    hitboxesRef.current = newHitboxes;

    // 3. Recréer les listeners avec les nouveaux objets
    rebuildInteractionListeners();
  }, [familyData]);

  // ---------------------------------------------------------------------------
  // Listeners d'interaction
  // ---------------------------------------------------------------------------

  /**
   * Supprime les anciens listeners hover/click et en crée de nouveaux.
   * Appelé à chaque changement de familyData.
   */
  const rebuildInteractionListeners = useCallback(() => {
    const setup = sceneRef.current;
    if (!setup) return;

    if (cleanupHoverRef.current) cleanupHoverRef.current();
    if (cleanupClickRef.current) cleanupClickRef.current();

    cleanupHoverRef.current = handleHover(
      setup.renderer,
      setup.camera,
      pointsRef.current,
      hitboxesRef.current
    );

    cleanupClickRef.current = handleClick(
      setup.renderer,
      setup.camera,
      pointsRef.current,
      linesRef.current,
      familyData,
      onSelectPerson
    );
  }, [familyData, onSelectPerson]);

  // ---------------------------------------------------------------------------
  // Contrôles
  // ---------------------------------------------------------------------------

  const handleZoomIn = () => {
    if (!sceneRef.current) return;
    sceneRef.current.camera.position.z -= 5;
  };

  const handleZoomOut = () => {
    if (!sceneRef.current) return;
    sceneRef.current.camera.position.z += 5;
  };

  const handleResetClick = () => {
    if (!sceneRef.current) return;
    resetView(
      sceneRef.current.camera,
      sceneRef.current.controls,
      linesRef.current
    );
  };

  // ---------------------------------------------------------------------------
  // Rendu
  // ---------------------------------------------------------------------------

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
