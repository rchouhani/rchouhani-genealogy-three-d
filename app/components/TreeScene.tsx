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
import { SceneSetup, LineObject } from "../types/scene";

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
 *   - Recréer les points et liens chaque fois que familyData change.
 *   - Gérer les interactions visuelles (hover, click, zoom, reset).
 *   - Nettoyer proprement à l'unmount.
 *
 * Ce qui n'est PAS fait ici :
 *   - Créer ou modifier des données (Person, Relation).
 *   - Générer des IDs.
 *   - Gérer l'état métier.
 *
 * @param familyData      - Liste des membres (source de vérité, vient de page.tsx).
 * @param selectedPerson  - Personne actuellement sélectionnée.
 * @param onSelectPerson  - Callback quand une personne est cliquée dans la scène.
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

  /** Stocker les cleanup de hover et click séparément pour les recréer sans toucher aux autres listeners. */
  const cleanupHoverRef = useRef<(() => void) | null>(null);
  const cleanupClickRef = useRef<(() => void) | null>(null);

  // ---------------------------------------------------------------------------
  // Initialisation de la scène — UNE SEULE FOIS à la mise en place du composant
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

    return () => {
      cleanupResize();
      cleanupResetKey();
      setup.renderer.dispose();
      if (mountRef.current && setup.renderer.domElement.parentNode === mountRef.current) {
        mountRef.current.removeChild(setup.renderer.domElement);
      }
      sceneRef.current = null;
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Recréation des points et liens à chaque changement de familyData
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const setup = sceneRef.current;
    if (!setup) return;

    // 1. Supprimer les anciens points et liens de la scène
    pointsRef.current.forEach((mesh) => setup.scene.remove(mesh));
    linesRef.current.forEach((l) => setup.scene.remove(l.line));

    // 2. Créer les nouveaux points et liens
    const newPoints = createNodes(setup.scene, familyData);
    const newLines = createLinks(setup.scene, familyData, newPoints);

    pointsRef.current = newPoints;
    linesRef.current = newLines;

    // 3. Recréer les listeners hover et click avec les nouveaux points
    rebuildInteractionListeners();
  }, [familyData]);

  // ---------------------------------------------------------------------------
  // Recréation des listeners d'interaction (hover + click)
  // ---------------------------------------------------------------------------

  /**
   * Supprime les anciens listeners hover/click puis en crée de nouveaux.
   * Appelé à chaque fois que les points changent.
   * Aucun autre listener n'est touché (resize, keydown restent stables).
   */
  const rebuildInteractionListeners = useCallback(() => {
    const setup = sceneRef.current;
    if (!setup) return;

    // Cleanup des précédents
    if (cleanupHoverRef.current) cleanupHoverRef.current();
    if (cleanupClickRef.current) cleanupClickRef.current();

    // Nouveaux listeners
    cleanupHoverRef.current = handleHover(
      setup.renderer,
      setup.camera,
      pointsRef.current
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
  // Contrôles manuels (zoom, reset)
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
    resetView(sceneRef.current.camera, sceneRef.current.controls, linesRef.current);
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
