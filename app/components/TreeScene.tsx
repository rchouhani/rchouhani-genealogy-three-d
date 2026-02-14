"use client";

import * as THREE from "three";
import { useEffect, useRef, useCallback, useState } from "react";
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

/** Distance de la caméra au point lors du focus. */
const FOCUS_DISTANCE = 20;

/** Vitesse d'interpolation de la caméra (0-1, plus proche de 1 = plus rapide). */
const LERP_SPEED = 0.08;

/**
 * Composant responsable UNIQUEMENT du rendu 3D.
 *
 * Responsabilités :
 *   - Initialiser la scène Three.js une seule fois (mount).
 *   - Recréer les points, liens et hitboxes quand familyData change.
 *   - Centrer la caméra sur selectedPerson quand elle change.
 *   - Gérer les interactions visuelles (hover, click, zoom, freeze, reset).
 *   - Nettoyer proprement à l'unmount.
 *
 * Freeze :
 *   - isFrozenRef   : ref booléen lu dans handleClick (pas de re-render).
 *   - isFrozenState : state booléen pour le rendu visuel du bouton.
 *   - controls.enabled : bloque zoom + pan + rotation d'OrbitControls.
 *   - handleHover : non affecté par le freeze (toujours actif).
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

  /**
   * Cible de l'animation caméra.
   * null = pas d'animation en cours.
   * Mis à jour par le useEffect sur selectedPerson.
   */
  const cameraTargetRef = useRef<{
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
  } | null>(null);

  const isFrozenRef = useRef<boolean>(false);
  const [isFrozenState, setIsFrozenState] = useState(false);

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

    // Boucle d'animation — gère aussi l'interpolation caméra
    const animate = () => {
      requestAnimationFrame(animate);

      // Animation lerp vers la cible si active
      if (cameraTargetRef.current) {
        const { position, lookAt } = cameraTargetRef.current;

        setup.camera.position.lerp(position, LERP_SPEED);
        setup.controls.target.lerp(lookAt, LERP_SPEED);

        // Arrêter l'animation quand on est assez proche
        const distPos = setup.camera.position.distanceTo(position);
        const distLook = setup.controls.target.distanceTo(lookAt);

        if (distPos < 0.1 && distLook < 0.1) {
          setup.camera.position.copy(position);
          setup.controls.target.copy(lookAt);
          cameraTargetRef.current = null;
        }
      }

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
  // Recréation des points, liens et hitboxes quand familyData change
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const setup = sceneRef.current;
    if (!setup) return;

    pointsRef.current.forEach((mesh) => setup.scene.remove(mesh));
    linesRef.current.forEach((l) => setup.scene.remove(l.line));
    hitboxesRef.current.forEach((h) => setup.scene.remove(h.mesh));

    const newPoints = createNodes(setup.scene, familyData);
    const { lines: newLines, hitboxes: newHitboxes } = createLinks(
      setup.scene,
      familyData,
      newPoints
    );

    pointsRef.current = newPoints;
    linesRef.current = newLines;
    hitboxesRef.current = newHitboxes;

    rebuildInteractionListeners();
  }, [familyData]);

  // ---------------------------------------------------------------------------
  // Focus caméra sur selectedPerson
  // ---------------------------------------------------------------------------

  /**
   * Quand selectedPerson change, cherche le mesh correspondant
   * et déclenche une animation lerp de la caméra vers ce point.
   *
   * N'agit pas si selectedPerson est null (reset ou déselection).
   */
  useEffect(() => {
    if (!selectedPerson || !sceneRef.current) return;

    const mesh = pointsRef.current.find(
      (p) => p.userData.id === selectedPerson.id
    );

    if (!mesh) return;

    const targetPos = mesh.position.clone();

    // La caméra se positionne devant le point, à FOCUS_DISTANCE de distance
    cameraTargetRef.current = {
      position: new THREE.Vector3(
        targetPos.x,
        targetPos.y,
        targetPos.z + FOCUS_DISTANCE
      ),
      lookAt: targetPos,
    };
  }, [selectedPerson]);

  // ---------------------------------------------------------------------------
  // Listeners d'interaction
  // ---------------------------------------------------------------------------

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
      onSelectPerson,
      isFrozenRef
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

  const handleFreeze = () => {
    if (!sceneRef.current) return;
    const newFrozen = !isFrozenRef.current;
    isFrozenRef.current = newFrozen;
    setIsFrozenState(newFrozen);
    sceneRef.current.controls.enabled = !newFrozen;
  };

  /**
   * Reset : sort du freeze + annule animation caméra + réinitialise la vue.
   */
  const handleResetClick = () => {
    if (!sceneRef.current) return;

    if (isFrozenRef.current) {
      isFrozenRef.current = false;
      setIsFrozenState(false);
      sceneRef.current.controls.enabled = true;
    }

    // Annuler toute animation de caméra en cours
    cameraTargetRef.current = null;

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
        onFreeze={handleFreeze}
        onReset={handleResetClick}
        isFrozen={isFrozenState}
      />
    </>
  );
}
