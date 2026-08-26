/**
 * @fileoverview Tests unitaires pour la logique de filtrage des relations.
 *
 * Couvre :
 *   - Mapping relation → catégorie
 *   - Comportement par défaut (aucun filtre = "Mes proches")
 *   - Combinaison de plusieurs filtres actifs
 *   - Cas limites (personne sans relations, catégorie vide)
 */

import { getVisiblePersonIds, getRelationCategory } from './relationFilters';
import { Person } from '../types/family';
import { RelationType } from '../utils/generation';
import { RelationFilters } from '../types/scene';

// ---------------------------------------------------------------------------
// Helpers pour les tests
// ---------------------------------------------------------------------------

function createPerson(
  id: string,
  relations: Array<{ targetId: string; type: RelationType }>
): Person {
  return {
    id,
    firstName: 'Test',
    lastName: 'Person',
    generation: 0,
    relations,
  };
}

const DEFAULT_FILTERS: RelationFilters = {
  proches: false,
  elargie: false,
  recomposee: false,
  parAlliance: false,
  intergenerationnel: false,
};

// ---------------------------------------------------------------------------
// Tests : getRelationCategory
// ---------------------------------------------------------------------------

describe('getRelationCategory', () => {
  it('map "parent" vers ["proches"]', () => {
    expect(getRelationCategory('parent')).toEqual(['proches']);
  });

  it('map "child" vers ["proches"]', () => {
    expect(getRelationCategory('child')).toEqual(['proches']);
  });

  it('map "sibling" vers ["proches"]', () => {
    expect(getRelationCategory('sibling')).toEqual(['proches']);
  });

  it('map "spouse" vers ["proches"]', () => {
    expect(getRelationCategory('spouse')).toEqual(['proches']);
  });

  it('map "uncle" vers ["elargie"]', () => {
    expect(getRelationCategory('uncle')).toEqual(['elargie']);
  });

  it('map "cousin" vers ["elargie"]', () => {
    expect(getRelationCategory('cousin')).toEqual(['elargie']);
  });

  it('map "stepFather" vers ["recomposee"]', () => {
    expect(getRelationCategory('stepFather')).toEqual(['recomposee']);
  });

  it('map "brotherInLaw" vers ["parAlliance"]', () => {
    expect(getRelationCategory('brotherInLaw')).toEqual(['parAlliance']);
  });

  it('map "grandFather" vers ["intergenerationnel"]', () => {
    expect(getRelationCategory('grandFather')).toEqual(['intergenerationnel']);
  });
});

// ---------------------------------------------------------------------------
// Tests : getVisiblePersonIds - Comportement par défaut
// ---------------------------------------------------------------------------

describe('getVisiblePersonIds - comportement sans case cochée', () => {
  it("n'affiche RIEN si aucun filtre actif (plus de filet de sécurité)", () => {
    const person = createPerson('1', [
      { targetId: '2', type: 'parent' },
      { targetId: '3', type: 'child' },
      { targetId: '4', type: 'sibling' },
      { targetId: '5', type: 'spouse' },
    ]);

    const familyData: Person[] = [
      person,
      createPerson('2', []),
      createPerson('3', []),
      createPerson('4', []),
      createPerson('5', []),
    ];

    const visible = getVisiblePersonIds('1', familyData, DEFAULT_FILTERS);

    // Seule la personne sélectionnée reste visible : aucune case cochée
    // = aucune relation retenue. La checkbox reflète fidèlement l'affichage.
    expect(visible.size).toBe(1);
    expect(visible.has('1')).toBe(true);
    expect(visible.has('2')).toBe(false);
  });

  it('inclut uniquement la personne sélectionnée si elle n\'a aucune relation', () => {
    const person = createPerson('1', []);
    const familyData: Person[] = [person];

    const visible = getVisiblePersonIds('1', familyData, DEFAULT_FILTERS);

    expect(visible.size).toBe(1);
    expect(visible.has('1')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests : getVisiblePersonIds - Filtre "Mes proches" activé
// ---------------------------------------------------------------------------

describe('getVisiblePersonIds - filtre "Mes proches"', () => {
  it('affiche parents, enfants, fratrie, conjoint quand filtre actif', () => {
    const person = createPerson('1', [
      { targetId: '2', type: 'parent' },
      { targetId: '3', type: 'child' },
      { targetId: '4', type: 'sibling' },
      { targetId: '5', type: 'spouse' },
    ]);

    const familyData: Person[] = [
      person,
      createPerson('2', []),
      createPerson('3', []),
      createPerson('4', []),
      createPerson('5', []),
    ];

    const filters = { ...DEFAULT_FILTERS, proches: true };
    const visible = getVisiblePersonIds('1', familyData, filters);

    expect(visible.size).toBe(5);
    expect(visible.has('2')).toBe(true);
    expect(visible.has('3')).toBe(true);
    expect(visible.has('4')).toBe(true);
    expect(visible.has('5')).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Tests : getVisiblePersonIds - Filtre "Famille élargie"
// ---------------------------------------------------------------------------

describe('getVisiblePersonIds - filtre "Famille élargie"', () => {
  it('affiche oncles/tantes, cousins, neveux/nièces', () => {
    const person = createPerson('1', [
      { targetId: '2', type: 'parent' },   // proches (exclu)
      { targetId: '3', type: 'uncle' },    // élargie (inclus)
      { targetId: '4', type: 'cousin' },   // élargie (inclus)
      { targetId: '5', type: 'nephew' },   // élargie (inclus)
    ]);

    const familyData: Person[] = [
      person,
      createPerson('2', []),
      createPerson('3', []),
      createPerson('4', []),
      createPerson('5', []),
    ];

    const filters = { ...DEFAULT_FILTERS, elargie: true };
    const visible = getVisiblePersonIds('1', familyData, filters);

    expect(visible.size).toBe(4); // 1 + 3 élargie
    expect(visible.has('1')).toBe(true);
    expect(visible.has('2')).toBe(false); // parent exclu
    expect(visible.has('3')).toBe(true);  // uncle
    expect(visible.has('4')).toBe(true);  // cousin
    expect(visible.has('5')).toBe(true);  // nephew
  });
});

// ---------------------------------------------------------------------------
// Tests : getVisiblePersonIds - Combinaison de filtres
// ---------------------------------------------------------------------------

describe('getVisiblePersonIds - combinaison de filtres', () => {
  it('combine "Mes proches" + "Intergénérationnel" (union)', () => {
    const person = createPerson('1', [
      { targetId: '2', type: 'parent' },       // proches
      { targetId: '3', type: 'child' },        // proches
      { targetId: '4', type: 'sibling' },      // proches
      { targetId: '5', type: 'grandFather' },  // intergenerationnel
    ]);

    const familyData: Person[] = [
      person,
      createPerson('2', []),
      createPerson('3', []),
      createPerson('4', []),
      createPerson('5', []),
    ];

    const filters = {
      ...DEFAULT_FILTERS,
      proches: true,
      intergenerationnel: true,
    };

    const visible = getVisiblePersonIds('1', familyData, filters);

    expect(visible.size).toBe(5); // Tous inclus
  });

  it('affiche uniquement les catégories cochées', () => {
    const person = createPerson('1', [
      { targetId: '2', type: 'parent' },      // proches
      { targetId: '3', type: 'uncle' },       // élargie
      { targetId: '4', type: 'stepFather' },  // recomposee
    ]);

    const familyData: Person[] = [
      person,
      createPerson('2', []),
      createPerson('3', []),
      createPerson('4', []),
    ];

    // Uniquement "Famille élargie" coché
    const filters = { ...DEFAULT_FILTERS, elargie: true };
    const visible = getVisiblePersonIds('1', familyData, filters);

    expect(visible.size).toBe(2); // 1 + uncle
    expect(visible.has('2')).toBe(false); // parent exclu
    expect(visible.has('3')).toBe(true);  // uncle
    expect(visible.has('4')).toBe(false); // stepFather exclu
  });
});

// ---------------------------------------------------------------------------
// Tests : Edge cases
// ---------------------------------------------------------------------------

describe('getVisiblePersonIds - edge cases', () => {
  it('retourne uniquement la personne si startId introuvable', () => {
    const familyData: Person[] = [createPerson('1', [])];
    const visible = getVisiblePersonIds('INEXISTANT', familyData, DEFAULT_FILTERS);

    expect(visible.size).toBe(1);
    expect(visible.has('INEXISTANT')).toBe(true);
  });

  it('gère une base de données vide', () => {
    const visible = getVisiblePersonIds('1', [], DEFAULT_FILTERS);

    expect(visible.size).toBe(1);
    expect(visible.has('1')).toBe(true);
  });
});
