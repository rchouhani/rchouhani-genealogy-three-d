/**
 * @fileoverview Données initiales de la famille.
 *
 * Cette fonction est la seule source de données en tant que le backend
 * n'existe pas encore. Elle sera remplacée par un appel API plus tard.
 *
 * Règles respectées ici :
 *   - Chaque personne a un `firstName` et un `lastName` (pas de `name`).
 *   - Les relations utilisent `targetId` (pas `id`).
 *   - Les relations sont bidirectionnelles : si A est parent de B,
 *     alors B a aussi une relation "parent" vers A.
 *   - Les IDs sont stables et uniques.
 *
 * @returns {Person[]} La liste initiale des membres de la famille.
 */

import { Person } from "../types/family";

export const createFamilyData = (): Person[] => [
  {
    id: 1,
    firstName: "Jean",
    lastName: "Dupont",
    generation: 0,
    relations: [
      { targetId: 2, type: "child" },
      { targetId: 3, type: "child" },
    ],
  },
  {
    id: 2,
    firstName: "Pierre",
    lastName: "Dupont",
    generation: 1,
    relations: [
      { targetId: 1, type: "parent" },
      { targetId: 3, type: "sibling" },
      { targetId: 4, type: "child" },
      { targetId: 5, type: "child" },
    ],
  },
  {
    id: 3,
    firstName: "Marie",
    lastName: "Dupont",
    generation: 1,
    relations: [
      { targetId: 1, type: "parent" },
      { targetId: 2, type: "sibling" },
      { targetId: 6, type: "child" },
    ],
  },
  {
    id: 4,
    firstName: "Lucas",
    lastName: "Dupont",
    generation: 2,
    relations: [{ targetId: 2, type: "parent" }],
  },
  {
    id: 5,
    firstName: "Emma",
    lastName: "Dupont",
    generation: 2,
    relations: [{ targetId: 2, type: "parent" }],
  },
  {
    id: 6,
    firstName: "Noah",
    lastName: "Dupont",
    generation: 2,
    relations: [{ targetId: 3, type: "parent" }],
  },
];
