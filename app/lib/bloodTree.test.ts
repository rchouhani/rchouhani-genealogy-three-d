/**
 * @fileoverview Tests pour computeBloodTreeIds.
 *
 * Couvre :
 *   - Inclusion de la lignée directe (parents, enfants, grands-parents...)
 *   - Inclusion de la fratrie, demi-fratrie, cousins, oncles/tantes
 *   - Exclusion des relations "par alliance" (conjoint, beau-parent, etc.)
 *   - Le conjoint agit comme une "coupure" : on ne traverse pas au-delà
 *   - Cas limites (personne isolée, id introuvable)
 */

import { computeBloodTreeIds } from './bloodTree';
import { Person } from '../types/family';
import { RelationType } from '../utils/generation';

function createPerson(
  id: string,
  relations: Array<{ targetId: string; type: RelationType }> = []
): Person {
  return {
    id,
    firstName: id,
    lastName: 'Test',
    generation: 0,
    relations,
  };
}

describe('computeBloodTreeIds - lignée directe', () => {
  it('inclut parents et enfants directs', () => {
    const family = [
      createPerson('moi', [
        { targetId: 'pere', type: 'father' },
        { targetId: 'enfant', type: 'child' },
      ]),
      createPerson('pere', [{ targetId: 'moi', type: 'child' }]),
      createPerson('enfant', [{ targetId: 'moi', type: 'parent' }]),
    ];

    const tree = computeBloodTreeIds('moi', family);

    expect(tree.has('moi')).toBe(true);
    expect(tree.has('pere')).toBe(true);
    expect(tree.has('enfant')).toBe(true);
  });

  it('inclut les grands-parents (traversée sur plusieurs générations)', () => {
    const family = [
      createPerson('moi', [{ targetId: 'pere', type: 'father' }]),
      createPerson('pere', [
        { targetId: 'moi', type: 'child' },
        { targetId: 'grandPere', type: 'father' },
      ]),
      createPerson('grandPere', [{ targetId: 'pere', type: 'child' }]),
    ];

    const tree = computeBloodTreeIds('moi', family);

    expect(tree.has('grandPere')).toBe(true);
  });
});

describe('computeBloodTreeIds - fratrie et famille élargie', () => {
  it('inclut la fratrie', () => {
    const family = [
      createPerson('moi', [{ targetId: 'soeur', type: 'sister' }]),
      createPerson('soeur', [{ targetId: 'moi', type: 'sibling' }]),
    ];

    const tree = computeBloodTreeIds('moi', family);
    expect(tree.has('soeur')).toBe(true);
  });

  it('inclut la demi-fratrie (stepBrother/stepSister)', () => {
    const family = [
      createPerson('moi', [{ targetId: 'demiSoeur', type: 'stepSister' }]),
      createPerson('demiSoeur', [{ targetId: 'moi', type: 'stepSister' }]),
    ];

    const tree = computeBloodTreeIds('moi', family);
    expect(tree.has('demiSoeur')).toBe(true);
  });

  it('inclut oncles/tantes et cousins', () => {
    const family = [
      createPerson('moi', [{ targetId: 'oncle', type: 'uncle' }]),
      createPerson('oncle', [
        { targetId: 'moi', type: 'nephew' },
        { targetId: 'cousin', type: 'child' },
      ]),
      createPerson('cousin', [{ targetId: 'oncle', type: 'parent' }]),
    ];

    const tree = computeBloodTreeIds('moi', family);

    expect(tree.has('oncle')).toBe(true);
    expect(tree.has('cousin')).toBe(true);
  });
});

describe('computeBloodTreeIds - exclusions (par alliance)', () => {
  it('exclut le conjoint', () => {
    const family = [
      createPerson('moi', [{ targetId: 'conjoint', type: 'wife' }]),
      createPerson('conjoint', [{ targetId: 'moi', type: 'husband' }]),
    ];

    const tree = computeBloodTreeIds('moi', family);
    expect(tree.has('conjoint')).toBe(false);
  });

  it('exclut beau-père/belle-mère (aucun sens : ni parents du conjoint, ni nouveau conjoint d\'un parent)', () => {
    const family = [
      createPerson('moi', [{ targetId: 'beauPere', type: 'stepFather' }]),
      createPerson('beauPere', [{ targetId: 'moi', type: 'stepBrother' }]),
    ];

    const tree = computeBloodTreeIds('moi', family);
    expect(tree.has('beauPere')).toBe(false);
  });

  it('exclut beau-frère/belle-sœur et gendre/bru', () => {
    const family = [
      createPerson('moi', [
        { targetId: 'beauFrere', type: 'brotherInLaw' },
        { targetId: 'gendre', type: 'sonInLaw' },
      ]),
      createPerson('beauFrere', []),
      createPerson('gendre', []),
    ];

    const tree = computeBloodTreeIds('moi', family);
    expect(tree.has('beauFrere')).toBe(false);
    expect(tree.has('gendre')).toBe(false);
  });

  it('NE TRAVERSE PAS au-delà du conjoint : les parents du conjoint ne sont pas inclus', () => {
    // Le conjoint lui-même est exclu, donc on ne devrait même jamais
    // atteindre ses propres relations (pas de traversée depuis un noeud exclu).
    const family = [
      createPerson('moi', [{ targetId: 'conjoint', type: 'wife' }]),
      createPerson('conjoint', [
        { targetId: 'moi', type: 'husband' },
        { targetId: 'pereDuConjoint', type: 'father' },
      ]),
      createPerson('pereDuConjoint', [{ targetId: 'conjoint', type: 'child' }]),
    ];

    const tree = computeBloodTreeIds('moi', family);

    expect(tree.has('conjoint')).toBe(false);
    expect(tree.has('pereDuConjoint')).toBe(false);
  });
});

describe('computeBloodTreeIds - cas limites', () => {
  it('retourne un Set contenant uniquement la personne si elle est isolée', () => {
    const family = [createPerson('seul', [])];
    const tree = computeBloodTreeIds('seul', family);

    expect(tree.size).toBe(1);
    expect(tree.has('seul')).toBe(true);
  });

  it('retourne un Set avec juste l\'id demandé si la personne est introuvable', () => {
    const tree = computeBloodTreeIds('inexistant', []);
    expect(tree.size).toBe(1);
    expect(tree.has('inexistant')).toBe(true);
  });

  it('gère un cycle de relations sans boucle infinie', () => {
    // A -> B -> A (une relation "sibling" mutuelle, cas normal en pratique,
    // mais vérifie explicitement l'absence de boucle infinie).
    const family = [
      createPerson('a', [{ targetId: 'b', type: 'sibling' }]),
      createPerson('b', [{ targetId: 'a', type: 'sibling' }]),
    ];

    const tree = computeBloodTreeIds('a', family);
    expect(tree.size).toBe(2);
  });
});
