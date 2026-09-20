/**
 * @fileoverview Tests pour createOpacityAnimator.
 *
 * Le temps est TOUJOURS passé en paramètre explicite (jamais Date.now()
 * en interne) — permet de tester des animations de plusieurs secondes
 * instantanément, sans setTimeout ni fake timers Jest.
 */

import { createOpacityAnimator } from './opacityAnimator';

describe('createOpacityAnimator - animation simple', () => {
  it("ne change rien avant le délai de démarrage (delayMs)", () => {
    const animator = createOpacityAnimator();
    const target = { opacity: 1 };

    animator.queue(target, 0.4, { delayMs: 500, durationMs: 300, nowMs: 0 });

    // On avance de 200ms : toujours dans le délai (500ms), rien ne doit bouger.
    animator.tick(200);
    expect(target.opacity).toBe(1);
  });

  it('interpole linéairement pendant la durée de l\'animation', () => {
    const animator = createOpacityAnimator();
    const target = { opacity: 1 };

    animator.queue(target, 0, { delayMs: 0, durationMs: 1000, nowMs: 0 });

    animator.tick(500); // à mi-parcours
    expect(target.opacity).toBeCloseTo(0.5, 5);
  });

  it('atteint exactement la valeur cible à la fin de la durée', () => {
    const animator = createOpacityAnimator();
    const target = { opacity: 1 };

    animator.queue(target, 0.4, { delayMs: 0, durationMs: 300, nowMs: 0 });

    animator.tick(300);
    expect(target.opacity).toBe(0.4);
  });

  it('reste à la valeur cible après la fin (pas de dépassement)', () => {
    const animator = createOpacityAnimator();
    const target = { opacity: 1 };

    animator.queue(target, 0.4, { delayMs: 0, durationMs: 300, nowMs: 0 });

    animator.tick(300);
    animator.tick(10000); // très longtemps après
    expect(target.opacity).toBe(0.4);
  });
});

describe('createOpacityAnimator - délai (stagger)', () => {
  it('démarre exactement à nowMs + delayMs, pas avant', () => {
    const animator = createOpacityAnimator();
    const target = { opacity: 1 };

    // Mise en file à t=1000, avec un délai de 200ms → démarre à t=1200.
    animator.queue(target, 0, { delayMs: 200, durationMs: 400, nowMs: 1000 });

    animator.tick(1199);
    expect(target.opacity).toBe(1); // pas encore démarré

    animator.tick(1200); // pile au démarrage
    expect(target.opacity).toBe(1);

    animator.tick(1400); // à mi-parcours de la durée (200/400)
    expect(target.opacity).toBeCloseTo(0.5, 5);
  });
});

describe('createOpacityAnimator - re-mise en file (remplacement)', () => {
  it('remplace une animation en cours sur la MÊME cible par la nouvelle', () => {
    const animator = createOpacityAnimator();
    const target = { opacity: 1 };

    animator.queue(target, 0, { delayMs: 0, durationMs: 1000, nowMs: 0 });
    animator.tick(500); // opacity ≈ 0.5

    // Nouvelle animation vers 1 pendant qu'une autre est en cours dessus.
    animator.queue(target, 1, { delayMs: 0, durationMs: 500, nowMs: 500 });
    animator.tick(750); // mi-parcours de la NOUVELLE animation

    expect(target.opacity).toBeGreaterThan(0.5);
    expect(target.opacity).toBeLessThan(1);
  });

  it('deux cibles différentes sont animées indépendamment', () => {
    const animator = createOpacityAnimator();
    const a = { opacity: 1 };
    const b = { opacity: 1 };

    animator.queue(a, 0, { delayMs: 0, durationMs: 1000, nowMs: 0 });
    animator.queue(b, 0.4, { delayMs: 500, durationMs: 1000, nowMs: 0 });

    animator.tick(500);
    expect(a.opacity).toBeCloseTo(0.5, 5);
    expect(b.opacity).toBe(1); // b n'a pas encore démarré (délai 500)
  });
});

describe('createOpacityAnimator - clear', () => {
  it('clear() arrête toutes les animations en cours (les valeurs restent figées)', () => {
    const animator = createOpacityAnimator();
    const target = { opacity: 1 };

    animator.queue(target, 0, { delayMs: 0, durationMs: 1000, nowMs: 0 });
    animator.tick(500);
    const midValue = target.opacity;

    animator.clear();
    animator.tick(999999); // même très longtemps après, plus rien ne bouge
    expect(target.opacity).toBe(midValue);
  });
});
