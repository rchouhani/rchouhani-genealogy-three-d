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
import { RelationFilters } from "../types/scene";
// import { getVisiblePersonIds } from "../lib/relationFilters";
import { SceneSetup, LineObject, HitboxObject } from "../types/scene";

interface TreeSceneProps {
  familyData: Person[];
  selectedPerson: Person | null;
  onSelectPerson: (person: Person) => void;
  onAddMember: () => void;
  filters: RelationFilters;
}

const FOCUS_DISTANCE = 20;
const LERP_SPEED = 0.08;

export default function TreeScene({
  familyData,
  selectedPerson,
  onSelectPerson,
  onAddMember,
  filters,
}: TreeSceneProps) {
  const mountRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<SceneSetup | null>(null);
  const pointsRef = useRef<THREE.Mesh[]>([]);
  const linesRef = useRef<LineObject[]>([]);
  const hitboxesRef = useRef<HitboxObject[]>([]);

  const cleanupHoverRef = useRef<(() => void) | null>(null);
  const cleanupClickRef = useRef<(() => void) | null>(null);

  const cameraTargetRef = useRef<{
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
  } | null>(null);

  const isFrozenRef = useRef<boolean>(false);
  const [isFrozenState, setIsFrozenState] = useState(false);

  // ---------------------------------------------------------------------------
  // IMPORTANT : rebuildInteractionListeners déclaré EN PREMIER
  // avant tous les useEffect qui l'appellent.
  // Un useCallback n'est pas hoisted — si déclaré après, il est undefined
  // au moment où le useEffect s'exécute.
  // ---------------------------------------------------------------------------
  const rebuildInteractionListeners = useCallback(() => {
    const setup = sceneRef.current;
    if (!setup) return;

    if (cleanupHoverRef.current) cleanupHoverRef.current();
    if (cleanupClickRef.current) cleanupClickRef.current();

    // Hover : toujours actif, même en freeze
    cleanupHoverRef.current = handleHover(
      setup.renderer,
      setup.camera,
      pointsRef.current,
      hitboxesRef.current
    );

    // Click : bloqué si isFrozenRef.current === true
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

    const animate = () => {
      requestAnimationFrame(animate);

      if (cameraTargetRef.current) {
        const { position, lookAt } = cameraTargetRef.current;
        setup.camera.position.lerp(position, LERP_SPEED);
        setup.controls.target.lerp(lookAt, LERP_SPEED);

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
  }, [familyData, rebuildInteractionListeners]);

  // ---------------------------------------------------------------------------
  // Focus caméra sur selectedPerson
  // ---------------------------------------------------------------------------
  useEffect(() => {
    if (!selectedPerson || !sceneRef.current) return;

    const mesh = pointsRef.current.find(
      (p) => p.userData.id === selectedPerson.id
    );

    if (!mesh) return;

    const targetPos = mesh.position.clone();

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

  const handleResetClick = () => {
    if (!sceneRef.current) return;

    if (isFrozenRef.current) {
      isFrozenRef.current = false;
      setIsFrozenState(false);
      sceneRef.current.controls.enabled = true;
    }

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
        onAddMember={onAddMember}
        isFrozen={isFrozenState}
      />
    </>
  );
}
