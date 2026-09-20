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
import { createOpacityAnimator, OpacityAnimator } from "../lib/opacityAnimator";
import ControlsPanel from "./ControlsPanel";
import { Person } from "../types/family";
import { RelationFilters } from "../types/scene";
import { getVisiblePersonIds } from "../lib/relationFilters";
import { SceneSetup, LineObject, HitboxObject } from "../types/scene";

interface TreeSceneProps {
  familyData: Person[];
  selectedPerson: Person | null;
  onSelectPerson: (person: Person) => void;
  onAddMember: () => void;
  filters: RelationFilters;
  /**
   * Appelé au survol d'une personne (person) ou quand la souris la quitte
   * (null). Phase C : c'est CE callback qui ouvre/ferme la modale d'info
   * + icônes d'action — le clic simple garde son ancien rôle pour
   * l'instant (camera focus), il sera redéfini à la Phase D.
   */
  onHoverPerson: (
    person: Person | null,
    screenPosition?: { x: number; y: number }
  ) => void;
}

const FOCUS_DISTANCE = 20;
const LERP_SPEED = 0.08;
/** Rotation appliquée à la caméra pendant le survol (Phase C, spec validée). */
const HOVER_TILT_DEGREES = 20;
/** Durée du fondu croisé au clic (Phase D). */
const CLICK_FADE_DURATION_MS = 600;

export default function TreeScene({
  familyData,
  selectedPerson,
  onSelectPerson,
  onAddMember,
  filters,
  onHoverPerson,
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

  // Animateur d'opacité partagé par tout le composant, tické une fois par
  // frame dans la boucle de rendu ci-dessous. Créé une seule fois (l'objet
  // interne — une Map — doit survivre entre les re-renders, d'où le ref).
  const opacityAnimatorRef = useRef<OpacityAnimator>(createOpacityAnimator());

  // Position/lookAt caméra AVANT le début d'un survol, pour pouvoir y
  // revenir exactement quand la souris quitte la personne survolée.
  // null = aucun survol en cours actuellement.
  const preHoverCameraStateRef = useRef<{
    position: THREE.Vector3;
    lookAt: THREE.Vector3;
  } | null>(null);

  // Mémorise l'ensemble visible précédent pour ne faire varier QUE ce qui
  // change réellement d'état (visible → invisible ou l'inverse) au clic
  // suivant, plutôt que de rejouer une animation sur tout à chaque fois.
  // `null` = pas encore de calcul précédent (premier chargement).
  const previousVisibleIdsRef = useRef<Set<string> | null>(null);

  const isFrozenRef = useRef<boolean>(false);
  const [isFrozenState, setIsFrozenState] = useState(false);

  /**
   * Démarre/arrête la rotation caméra de survol, et relaie la personne
   * survolée à page.tsx (pour la modale d'info + icônes d'action).
   *
   * Rotation autour de l'axe X : on fait pivoter le VECTEUR caméra→cible
   * de 20°, pas la caméra elle-même autour de son propre axe — ça donne
   * un effet de "contournement" du point regardé plutôt qu'un simple
   * tangage sur place.
   */
  const handleHoverPersonChange = useCallback(
    (person: Person | null, screenPosition?: { x: number; y: number }) => {
      onHoverPerson(person, screenPosition);

      const setup = sceneRef.current;
      if (!setup) return;

      if (person) {
        // Ne capture l'état "avant survol" que si on ne survole rien
        // actuellement. IMPORTANT : on lit la DESTINATION visée par un
        // lerp en cours (cameraTargetRef.current), pas la position
        // ACTUELLE de la caméra — si un retour précédent est encore en
        // train de se faire (lerp en cours) quand un nouveau survol
        // démarre juste après (passage rapide point à point), lire la
        // position actuelle capturerait une valeur INTERMÉDIAIRE du
        // retour, pas la vraie position de repos, ce qui faisait
        // dériver la rotation à chaque cycle rapide hover/leave/hover.
        // La destination d'un lerp en cours EST déjà la bonne position
        // de repos (c'est justement ce vers quoi ce lerp ramène).
        if (!preHoverCameraStateRef.current) {
          preHoverCameraStateRef.current = cameraTargetRef.current
            ? {
                position: cameraTargetRef.current.position.clone(),
                lookAt: cameraTargetRef.current.lookAt.clone(),
              }
            : {
                position: setup.camera.position.clone(),
                lookAt: setup.controls.target.clone(),
              };
        }

        // IMPORTANT : la rotation est TOUJOURS calculée depuis la
        // position d'ORIGINE stockée (preHoverCameraStateRef), jamais
        // depuis la position actuelle de la caméra. Si cette fonction
        // est appelée plusieurs fois pour la même personne (par exemple
        // à cause d'un re-render qui recrée les listeners), le calcul
        // reste idempotent au lieu d'accumuler la rotation à chaque appel.
        const baseline = preHoverCameraStateRef.current;
        const offset = baseline.position.clone().sub(baseline.lookAt);
        const angleRad = THREE.MathUtils.degToRad(HOVER_TILT_DEGREES);
        // Axe Y (0,1,0) : rotation "orbite" autour de la verticale.
        // Axe X (1,0,0) donnerait un tangage haut/bas à la place.
        offset.applyAxisAngle(new THREE.Vector3(0, 1, 0), angleRad);

        cameraTargetRef.current = {
          position: baseline.lookAt.clone().add(offset),
          lookAt: baseline.lookAt.clone(),
        };
      } else if (preHoverCameraStateRef.current) {
        // Fin du survol : retour exact à la position d'avant.
        cameraTargetRef.current = preHoverCameraStateRef.current;
        preHoverCameraStateRef.current = null;
      }
    },
    [onHoverPerson]
  );

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
      linesRef.current,
      hitboxesRef.current,
      familyData,
      opacityAnimatorRef.current,
      handleHoverPersonChange
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
  }, [familyData, onSelectPerson, handleHoverPersonChange]);

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

      // Fait avancer toutes les animations d'opacité en cours (fondus de
      // survol notamment) — une fois par frame, comme le lerp caméra.
      opacityAnimatorRef.current.tick(performance.now());

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
      if (cleanupHoverRef.current) cleanupHoverRef.current();
      if (cleanupClickRef.current) cleanupClickRef.current();

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

    // Reset : la structure de la famille a changé (personne ajoutée/
    // supprimée/relation modifiée), l'ancien ensemble "visible précédent"
    // n'est plus fiable pour calculer un fondu cohérent. Le prochain
    // passage de l'effet de filtres fera un état initial direct (sans
    // fondu), comme au tout premier chargement.
    previousVisibleIdsRef.current = null;

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
  // Application des filtres de relations — Phase D : fondu animé au lieu
  // d'une bascule instantanée de .visible. Chaque point/trait qui change
  // réellement d'état (devient visible ou invisible) est animé via
  // opacityAnimatorRef ; ceux qui ne changent pas restent immobiles.
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (!selectedPerson || !sceneRef.current) return;

    const visibleIds = getVisiblePersonIds(
      selectedPerson.id,
      familyData,
      filters
    );

    const previousVisibleIds = previousVisibleIdsRef.current;
    // Premier calcul (au montage, ou après un rechargement de familyData) :
    // état initial direct, SANS fondu — un fondu au tout premier affichage
    // n'aurait aucun sens (rien à comparer, ça ferait juste clignoter).
    const isFirstComputation = previousVisibleIds === null;
    const now = performance.now();

    pointsRef.current.forEach((mesh) => {
      const id = mesh.userData?.id as string | undefined;
      if (!id) return;

      const isVisible = visibleIds.has(id);
      const wasVisible = previousVisibleIds ? previousVisibleIds.has(id) : null;

      // Ne (re)lance une animation QUE si l'état a réellement changé —
      // évite de perturber une personne déjà visible avant et après.
      if (isFirstComputation || wasVisible !== isVisible) {
        const mat = mesh.material as THREE.Material & { opacity: number };
        opacityAnimatorRef.current.queue(mat, isVisible ? 1 : 0, {
          delayMs: 0,
          durationMs: isFirstComputation ? 0 : CLICK_FADE_DURATION_MS,
          nowMs: now,
        });
      }
    });

    linesRef.current.forEach((lineObj) => {
      const isVisible =
        visibleIds.has(lineObj.sourceId) && visibleIds.has(lineObj.targetId);
      const wasVisible = previousVisibleIds
        ? previousVisibleIds.has(lineObj.sourceId) &&
          previousVisibleIds.has(lineObj.targetId)
        : null;

      // La ligne reste "visible" (au sens Three.js) tout du long — c'est
      // l'opacité qui porte l'effet, pas line.visible. Une ligne à
      // opacity 0 mais visible=true ne se voit pas, mais peut continuer
      // à être animée en douceur (contrairement à visible=false qui la
      // ferait disparaître d'un coup, sans transition).
      lineObj.line.visible = true;

      if (isFirstComputation || wasVisible !== isVisible) {
        const mat = lineObj.line.material as THREE.Material & {
          opacity: number;
        };
        opacityAnimatorRef.current.queue(mat, isVisible ? 0.6 : 0, {
          delayMs: 0,
          durationMs: isFirstComputation ? 0 : CLICK_FADE_DURATION_MS,
          nowMs: now,
        });
      }
    });

    previousVisibleIdsRef.current = visibleIds;
  }, [selectedPerson, familyData, filters]);

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
