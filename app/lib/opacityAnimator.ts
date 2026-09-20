/**
 * @fileoverview Animateur d'opacité générique, indépendant de Three.js.
 *
 * Fonctionne sur n'importe quel objet ayant une propriété `opacity`
 * numérique (un THREE.Material réel, ou un objet simple en test) — pas
 * de dépendance à THREE ici, ce qui permet de tester la logique de lerp
 * et de timing sans jamais instancier de vraie scène 3D.
 *
 * Le temps est TOUJOURS fourni en paramètre (jamais Date.now() interne) :
 * `tick(nowMs)` doit être appelé depuis la boucle de rendu existante
 * (voir le `requestAnimationFrame` déjà présent dans TreeScene.tsx pour
 * le lerp de caméra) — on réutilise CETTE boucle plutôt que d'en
 * démarrer une deuxième indépendante.
 *
 * Réutilisé par :
 *   - Phase C (survol) : fondu vers 40%, points puis relations décalées.
 *   - Phase D (clic)   : fondu croisé complet 100%→0% / 0%→100%.
 */

export interface OpacityTarget {
  opacity: number;
}

interface QueueOptions {
  /** Délai avant que l'animation ne démarre, en ms. */
  delayMs: number;
  /** Durée de l'animation elle-même (une fois démarrée), en ms. */
  durationMs: number;
  /** Horodatage actuel au moment de la mise en file (ms). */
  nowMs: number;
}

interface ActiveAnimation {
  target: OpacityTarget;
  from: number;
  to: number;
  /** Horodatage absolu de démarrage (nowMs + delayMs au moment du queue()). */
  startAt: number;
  durationMs: number;
}

export interface OpacityAnimator {
  /**
   * Programme une transition d'opacité pour `target`.
   * Si une animation est déjà en cours sur CE MÊME objet `target`
   * (référence identique), elle est remplacée par la nouvelle — évite
   * deux animations concurrentes qui se battraient sur la même valeur.
   */
  queue: (target: OpacityTarget, to: number, options: QueueOptions) => void;

  /**
   * Fait avancer toutes les animations en cours jusqu'à l'instant `nowMs`.
   * À appeler une fois par frame depuis la boucle de rendu.
   */
  tick: (nowMs: number) => void;

  /** Annule toutes les animations en cours (les valeurs restent figées). */
  clear: () => void;
}

/**
 * Interpolation linéaire bornée : t est automatiquement contraint à [0, 1]
 * avant l'interpolation, donc appeler avec t<0 ou t>1 ne dépasse jamais
 * la plage [from, to] (voir tests "reste à la valeur cible après la fin").
 */
function lerp(from: number, to: number, t: number): number {
  const clamped = Math.min(1, Math.max(0, t));
  return from + (to - from) * clamped;
}

export function createOpacityAnimator(): OpacityAnimator {
  // Map plutôt qu'un tableau : la clé est la référence de l'objet cible
  // lui-même, ce qui permet de retrouver/remplacer en O(1) une animation
  // déjà en cours sur ce même objet (voir `queue`).
  const animations = new Map<OpacityTarget, ActiveAnimation>();

  function queue(
    target: OpacityTarget,
    to: number,
    { delayMs, durationMs, nowMs }: QueueOptions
  ): void {
    animations.set(target, {
      target,
      // `target.opacity` capturé ICI (valeur actuelle au moment du queue,
      // pas au moment du démarrage réel après le délai) : évite un saut
      // visuel si l'opacité a déjà bougé entre la mise en file et le
      // démarrage effectif de cette nouvelle animation.
      from: target.opacity,
      to,
      startAt: nowMs + delayMs,
      durationMs,
    });
  }

  function tick(nowMs: number): void {
    for (const anim of animations.values()) {
      if (nowMs < anim.startAt) continue; // délai pas encore écoulé

      const elapsed = nowMs - anim.startAt;
      const t = anim.durationMs === 0 ? 1 : elapsed / anim.durationMs;

      anim.target.opacity = lerp(anim.from, anim.to, t);
    }
  }

  function clear(): void {
    animations.clear();
  }

  return { queue, tick, clear };
}
