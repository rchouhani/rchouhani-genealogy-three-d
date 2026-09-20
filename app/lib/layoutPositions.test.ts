/**
 * @fileoverview Tests pour computeGenerationalLayout — version 2 (Option C).
 *
 * Règle de colonnes (X) :
 *   - Une relation "de sang" (BLOOD_RELATION_TYPES) → MÊME colonne.
 *   - Une relation "par alliance" (conjoint, beau-parent, etc.) →
 *     NOUVELLE colonne pour la personne "qui entre dans la famille".
 *   → Toute la lignée de sang de quelqu'un reste dans UNE SEULE colonne,
 *     pour toujours, peu importe le nombre de générations remontées.
 *
 * Règle de profondeur (Z) :
 *   - Plusieurs personnes partageant la même case (colonne, génération)
 *     sont empilées sur Z, dans l'ordre d'ajout en base (approximé par
 *     l'ordre du tableau familyData en entrée).
 */

import { computeGenerationalLayout, LAYOUT_SPACING } from './layoutPositions';
import { Person } from '../types/family';
import { RelationType } from '../utils/generation';

function createPerson(
  id: string,
  generation: number,
  relations: Array<{ targetId: string; type: RelationType }> = []
): Person {
  return {
    id,
    firstName: id,
    lastName: 'Test',
    generation,
    relations,
  };
}

describe('computeGenerationalLayout v2 - colonnes (X)', () => {
  it('place moi et mon conjoint dans deux colonnes DIFFÉRENTES', () => {
    const family = [
      createPerson('moi', 0, [{ targetId: 'femme', type: 'wife' }]),
      createPerson('femme', 0, [{ targetId: 'moi', type: 'husband' }]),
    ];

    const layout = computeGenerationalLayout(family);
    expect(layout.get('moi')!.x).not.toBe(layout.get('femme')!.x);
  });

  it('place ma mère et mon père dans la MÊME colonne que moi (tous deux "de sang")', () => {
    const family = [
      createPerson('moi', 0, [
        { targetId: 'mere', type: 'mother' },
        { targetId: 'pere', type: 'father' },
      ]),
      createPerson('mere', -1, [{ targetId: 'moi', type: 'child' }]),
      createPerson('pere', -1, [{ targetId: 'moi', type: 'child' }]),
    ];

    const layout = computeGenerationalLayout(family);
    const xMoi = layout.get('moi')!.x;

    expect(layout.get('mere')!.x).toBe(xMoi);
    expect(layout.get('pere')!.x).toBe(xMoi);
  });

  it('la mère ET le père du CONJOINT restent dans la colonne du conjoint (pas une 3e colonne)', () => {
    const family = [
      createPerson('moi', 0, [{ targetId: 'femme', type: 'wife' }]),
      createPerson('femme', 0, [
        { targetId: 'moi', type: 'husband' },
        { targetId: 'mereFemme', type: 'mother' },
        { targetId: 'pereFemme', type: 'father' },
      ]),
      createPerson('mereFemme', -1, [{ targetId: 'femme', type: 'child' }]),
      createPerson('pereFemme', -1, [{ targetId: 'femme', type: 'child' }]),
    ];

    const layout = computeGenerationalLayout(family);
    const xFemme = layout.get('femme')!.x;

    expect(layout.get('mereFemme')!.x).toBe(xFemme);
    expect(layout.get('pereFemme')!.x).toBe(xFemme);
    expect(xFemme).not.toBe(layout.get('moi')!.x);
  });

  it('remonter plusieurs générations de sang ne crée AUCUNE nouvelle colonne', () => {
    const family = [
      createPerson('moi', 0, [{ targetId: 'mere', type: 'mother' }]),
      createPerson('mere', -1, [
        { targetId: 'moi', type: 'child' },
        { targetId: 'grandMere', type: 'mother' },
      ]),
      createPerson('grandMere', -2, [{ targetId: 'mere', type: 'child' }]),
    ];

    const layout = computeGenerationalLayout(family);
    const xMoi = layout.get('moi')!.x;

    expect(layout.get('mere')!.x).toBe(xMoi);
    expect(layout.get('grandMere')!.x).toBe(xMoi);
  });

  it('un beau-frère (par alliance) obtient une colonne différente de son beau-frère de sang', () => {
    const family = [
      createPerson('moi', 0, [{ targetId: 'beauFrere', type: 'brotherInLaw' }]),
      createPerson('beauFrere', 0, []),
    ];

    const layout = computeGenerationalLayout(family);
    expect(layout.get('beauFrere')!.x).not.toBe(layout.get('moi')!.x);
  });
});

describe('computeGenerationalLayout v2 - profondeur (Z)', () => {
  it("attribue des Z différents à deux personnes qui partagent la même case (colonne + génération)", () => {
    const family = [
      createPerson('moi', 0, [
        { targetId: 'mere', type: 'mother' },
        { targetId: 'pere', type: 'father' },
      ]),
      createPerson('mere', -1, []),
      createPerson('pere', -1, []),
    ];

    const layout = computeGenerationalLayout(family);

    expect(layout.get('mere')!.x).toBe(layout.get('pere')!.x);
    expect(layout.get('mere')!.y).toBe(layout.get('pere')!.y);
    expect(layout.get('mere')!.z).not.toBe(layout.get('pere')!.z);
  });

  it("l'ordre du tableau d'entrée détermine l'ordre des Z (mère avant père ici)", () => {
    const family = [
      createPerson('moi', 0, [
        { targetId: 'mere', type: 'mother' },
        { targetId: 'pere', type: 'father' },
      ]),
      createPerson('mere', -1, []),
      createPerson('pere', -1, []),
    ];

    const layout = computeGenerationalLayout(family);
    expect(layout.get('mere')!.z).toBeLessThan(layout.get('pere')!.z);
  });

  it('une personne seule dans sa case a toujours un Z valide (pas de conflit)', () => {
    const family = [createPerson('seul', 0, [])];
    const layout = computeGenerationalLayout(family);
    expect(Number.isNaN(layout.get('seul')!.z)).toBe(false);
  });
});

describe('computeGenerationalLayout v2 - Y (inchangé, dérivé de la génération)', () => {
  it('génération -1 → Y positif, génération +1 → Y négatif', () => {
    const family = [
      createPerson('moi', 0, [
        { targetId: 'parent', type: 'parent' },
        { targetId: 'enfant', type: 'child' },
      ]),
      createPerson('parent', -1, []),
      createPerson('enfant', 1, []),
    ];

    const layout = computeGenerationalLayout(family);
    expect(layout.get('parent')!.y).toBeGreaterThan(0);
    expect(layout.get('enfant')!.y).toBeLessThan(0);
  });
});

describe('computeGenerationalLayout v2 - ancrage et symétrie (selfId)', () => {
  it('la personne selfId obtient TOUJOURS la colonne 0, peu importe sa position dans le tableau', () => {
    const family = [
      createPerson('autre', 0, []),
      createPerson('moi', 0, [{ targetId: 'femme', type: 'wife' }]), // "moi" en 2e position
      createPerson('femme', 0, [{ targetId: 'moi', type: 'husband' }]),
    ];

    const layout = computeGenerationalLayout(family, 'moi');
    expect(layout.get('moi')!.x).toBe(0);
  });

  it('les nouvelles colonnes alternent de part et d\'autre de 0 (pas toujours du même côté)', () => {
    const family = [
      createPerson('moi', 0, [
        { targetId: 'femme', type: 'wife' },
        { targetId: 'beauFrere', type: 'brotherInLaw' },
      ]),
      createPerson('femme', 0, [{ targetId: 'moi', type: 'husband' }]),
      createPerson('beauFrere', 0, [{ targetId: 'moi', type: 'sisterInLaw' }]),
    ];

    const layout = computeGenerationalLayout(family, 'moi');

    const xFemme = layout.get('femme')!.x;
    const xBeauFrere = layout.get('beauFrere')!.x;

    // Les deux nouvelles colonnes doivent être de SIGNES OPPOSÉS
    // (une positive, une négative) — pas toutes les deux du même côté.
    expect(Math.sign(xFemme)).not.toBe(Math.sign(xBeauFrere));
  });
});

describe('computeGenerationalLayout v2 - cas limites', () => {
  it('gère une famille vide', () => {
    const layout = computeGenerationalLayout([]);
    expect(layout.size).toBe(0);
  });

  it('retourne x, y ET z pour chaque personne', () => {
    const family = [createPerson('a', 0), createPerson('b', -1)];
    const layout = computeGenerationalLayout(family);

    for (const id of ['a', 'b']) {
      const pos = layout.get(id)!;
      expect(typeof pos.x).toBe('number');
      expect(typeof pos.y).toBe('number');
      expect(typeof pos.z).toBe('number');
    }
  });

  it('deux personnes totalement isolées obtiennent des colonnes différentes', () => {
    const family = [createPerson('a', 0, []), createPerson('b', 0, [])];
    const layout = computeGenerationalLayout(family);
    expect(layout.get('a')!.x).not.toBe(layout.get('b')!.x);
  });

  it('déterministe : deux appels avec la même entrée donnent le même résultat', () => {
    const family = [
      createPerson('moi', 0, [{ targetId: 'femme', type: 'wife' }]),
      createPerson('femme', 0, [{ targetId: 'moi', type: 'husband' }]),
    ];

    const l1 = computeGenerationalLayout(family);
    const l2 = computeGenerationalLayout(family);

    expect(l1.get('moi')).toEqual(l2.get('moi'));
    expect(l1.get('femme')).toEqual(l2.get('femme'));
  });
});
