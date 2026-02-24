/**
 * @fileoverview Tests unitaires pour showConnections (BFS).
 *
 * Couvre :
 *   - Cas simple : 1 personne, aucune relation
 *   - Cas linéaire : A → B → C → D
 *   - Cas arbre : 1 parent, 3 enfants
 *   - Cas limite : plus de 10 relations (BFS s'arrête)
 *   - Cas bidirectionnel : les lignes sont affichées dans les deux sens
 */

import showConnections from './bfs';
import { Person } from '../types/family';
import { LineObject } from '../types/scene';

/**
 * Helper : crée un mock de THREE.Line pour les tests.
 * On ne teste pas Three.js ici, juste la logique BFS.
 */
function createMockLine(sourceId: string, targetId: string): LineObject {
  return {
    sourceId,
    targetId,
    line: {
      visible: true, // Initialement visible
    } as any, // Cast car on ne teste que la propriété .visible
    type: 'child',
  };
}

describe('showConnections (BFS)', () => {
  
  // ---------------------------------------------------------------------------
  // Cas 1 : Personne isolée (aucune relation)
  // ---------------------------------------------------------------------------

  it('masque toutes les lignes si la personne n\'a aucune relation', () => {
    const familyData: Person[] = [
      {
        id: '1',
        firstName: 'Jean',
        lastName: 'Dupont',
        generation: 0,
        relations: [], // Aucune relation
      },
    ];

    const lines: LineObject[] = [
      createMockLine('1', '2'), // Ligne orpheline (personne 2 n'existe pas)
      createMockLine('3', '4'), // Autre ligne orpheline
    ];

    showConnections('1', lines, familyData);

    // Toutes les lignes doivent être masquées
    expect(lines[0].line.visible).toBe(false);
    expect(lines[1].line.visible).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Cas 2 : Graphe linéaire A → B → C
  // ---------------------------------------------------------------------------

  it('affiche les connexions dans un graphe linéaire', () => {
    const familyData: Person[] = [
      {
        id: 'A',
        firstName: 'Alice',
        lastName: 'Dupont',
        generation: 0,
        relations: [{ targetId: 'B', type: 'child' }],
      },
      {
        id: 'B',
        firstName: 'Bob',
        lastName: 'Dupont',
        generation: 1,
        relations: [
          { targetId: 'A', type: 'parent' },
          { targetId: 'C', type: 'child' },
        ],
      },
      {
        id: 'C',
        firstName: 'Charlie',
        lastName: 'Dupont',
        generation: 2,
        relations: [{ targetId: 'B', type: 'parent' }],
      },
    ];

    const lines: LineObject[] = [
      createMockLine('A', 'B'),
      createMockLine('B', 'C'),
      createMockLine('X', 'Y'), // Ligne non connectée
    ];

    showConnections('A', lines, familyData);

    // A → B et B → C doivent être visibles
    expect(lines[0].line.visible).toBe(true);  // A-B
    expect(lines[1].line.visible).toBe(true);  // B-C

    // La ligne X-Y non connectée doit être masquée
    expect(lines[2].line.visible).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Cas 3 : Arbre (1 parent → 3 enfants)
  // ---------------------------------------------------------------------------

  it('affiche toutes les branches dans un arbre', () => {
    const familyData: Person[] = [
      {
        id: 'Parent',
        firstName: 'Parent',
        lastName: 'Dupont',
        generation: 0,
        relations: [
          { targetId: 'Enfant1', type: 'child' },
          { targetId: 'Enfant2', type: 'child' },
          { targetId: 'Enfant3', type: 'child' },
        ],
      },
      {
        id: 'Enfant1',
        firstName: 'Enfant1',
        lastName: 'Dupont',
        generation: 1,
        relations: [{ targetId: 'Parent', type: 'parent' }],
      },
      {
        id: 'Enfant2',
        firstName: 'Enfant2',
        lastName: 'Dupont',
        generation: 1,
        relations: [{ targetId: 'Parent', type: 'parent' }],
      },
      {
        id: 'Enfant3',
        firstName: 'Enfant3',
        lastName: 'Dupont',
        generation: 1,
        relations: [{ targetId: 'Parent', type: 'parent' }],
      },
    ];

    const lines: LineObject[] = [
      createMockLine('Parent', 'Enfant1'),
      createMockLine('Parent', 'Enfant2'),
      createMockLine('Parent', 'Enfant3'),
      createMockLine('X', 'Y'), // Non connecté
    ];

    showConnections('Parent', lines, familyData);

    // Les 3 lignes parent-enfants doivent être visibles
    expect(lines[0].line.visible).toBe(true);
    expect(lines[1].line.visible).toBe(true);
    expect(lines[2].line.visible).toBe(true);

    // La ligne non connectée doit être masquée
    expect(lines[3].line.visible).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Cas 4 : Limite de 10 relations
  // ---------------------------------------------------------------------------

  it('arrête le BFS après 10 relations explorées', () => {
    // Créer une chaîne linéaire de 15 personnes
    const familyData: Person[] = [];
    const lines: LineObject[] = [];

    for (let i = 0; i < 15; i++) {
      const id = `P${i}`;
      const nextId = `P${i + 1}`;

      familyData.push({
        id,
        firstName: `Person${i}`,
        lastName: 'Test',
        generation: i,
        relations: i < 14 ? [{ targetId: nextId, type: 'child' }] : [],
      });

      if (i < 14) {
        lines.push(createMockLine(id, nextId));
      }
    }

    showConnections('P0', lines, familyData);

    // Les 10 premières lignes doivent être visibles
    for (let i = 0; i < 10; i++) {
      expect(lines[i].line.visible).toBe(true);
    }

    // Les lignes au-delà de 10 doivent être masquées
    for (let i = 10; i < 14; i++) {
      expect(lines[i].line.visible).toBe(false);
    }
  });

  // ---------------------------------------------------------------------------
  // Cas 5 : Bidirectionnel (ligne affichée dans les deux sens)
  // ---------------------------------------------------------------------------

  it('affiche une ligne quelle que soit sa direction (sourceId ↔ targetId)', () => {
    const familyData: Person[] = [
      {
        id: 'A',
        firstName: 'Alice',
        lastName: 'Dupont',
        generation: 0,
        relations: [{ targetId: 'B', type: 'child' }],
      },
      {
        id: 'B',
        firstName: 'Bob',
        lastName: 'Dupont',
        generation: 1,
        relations: [{ targetId: 'A', type: 'parent' }],
      },
    ];

    // Ligne stockée dans le sens B → A (inverse de la relation A → B)
    const lines: LineObject[] = [
      createMockLine('B', 'A'),
    ];

    showConnections('A', lines, familyData);

    // La ligne doit être visible même si sourceId/targetId sont inversés
    expect(lines[0].line.visible).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Cas 6 : Personne inexistante
  // ---------------------------------------------------------------------------

  it('ne crash pas si startId n\'existe pas dans familyData', () => {
    const familyData: Person[] = [
      {
        id: 'A',
        firstName: 'Alice',
        lastName: 'Dupont',
        generation: 0,
        relations: [],
      },
    ];

    const lines: LineObject[] = [
      createMockLine('A', 'B'),
    ];

    // Ne doit pas crasher
    expect(() => {
      showConnections('INEXISTANT', lines, familyData);
    }).not.toThrow();

    // Toutes les lignes doivent être masquées
    expect(lines[0].line.visible).toBe(false);
  });

  // ---------------------------------------------------------------------------
  // Cas 7 : Graphe cyclique (pas de boucle infinie)
  // ---------------------------------------------------------------------------

  it('gère les cycles sans boucle infinie', () => {
    const familyData: Person[] = [
      {
        id: 'A',
        firstName: 'Alice',
        lastName: 'Dupont',
        generation: 0,
        relations: [{ targetId: 'B', type: 'spouse' }],
      },
      {
        id: 'B',
        firstName: 'Bob',
        lastName: 'Dupont',
        generation: 0,
        relations: [{ targetId: 'A', type: 'spouse' }],
      },
    ];

    const lines: LineObject[] = [
      createMockLine('A', 'B'),
    ];

    // Ne doit pas boucler indéfiniment
    showConnections('A', lines, familyData);

    // La ligne A-B doit être visible
    expect(lines[0].line.visible).toBe(true);
  });

  // ---------------------------------------------------------------------------
  // Cas 8 : Toutes les lignes masquées au départ
  // ---------------------------------------------------------------------------

  it('masque toutes les lignes avant de commencer le BFS', () => {
    const familyData: Person[] = [
      {
        id: 'A',
        firstName: 'Alice',
        lastName: 'Dupont',
        generation: 0,
        relations: [{ targetId: 'B', type: 'child' }],
      },
      {
        id: 'B',
        firstName: 'Bob',
        lastName: 'Dupont',
        generation: 1,
        relations: [{ targetId: 'A', type: 'parent' }],
      },
    ];

    const lines: LineObject[] = [
      createMockLine('A', 'B'),
      createMockLine('X', 'Y'),
    ];

    // Les deux lignes sont initialement visibles
    lines[0].line.visible = true;
    lines[1].line.visible = true;

    showConnections('A', lines, familyData);

    // A-B visible (connectée), X-Y masquée (non connectée)
    expect(lines[0].line.visible).toBe(true);
    expect(lines[1].line.visible).toBe(false);
  });
});
