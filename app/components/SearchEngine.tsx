"use client";

import { useState } from "react";
import { Person } from "../types/family";

interface SearchEngineProps {
  persons: Person[];
  onSelectPerson: (person: Person) => void;
  onCreatePerson: () => void;
}

/**
 * Moteur de recherche de personnes dans l'arbre.
 *
 * Affiché uniquement si persons.length >= 10 (géré dans page.tsx).
 *
 * Comportement :
 *   - Filtre sur prénom + nom (insensible à la casse).
 *   - Sélectionner un résultat → callback onSelectPerson.
 *   - Bouton "+" → ouvre le formulaire d'ajout.
 *   - Message d'erreur si aucun résultat.
 */
export default function SearchEngine({
  persons,
  onSelectPerson,
  onCreatePerson,
}: SearchEngineProps) {
  const [query, setQuery] = useState("");

  /**
   * Filtre les personnes dont le prénom + nom contient la requête.
   * Recalculé à chaque rendu (pas de memo nécessaire à cette taille).
   */
  const results = query.trim().length > 0
    ? persons.filter((p) => {
        const full = `${p.firstName} ${p.lastName}`.toLowerCase();
        return full.includes(query.toLowerCase());
      })
    : [];

  const handleSelect = (person: Person) => {
    setQuery("");
    onSelectPerson(person);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      {/* Barre de recherche */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          className="w-full px-4 py-2 rounded-lg border border-gray-300 bg-white/90
                     text-gray-800 placeholder-gray-400 shadow-md
                     focus:outline-none focus:ring-2 focus:ring-blue-400"
          placeholder="Rechercher une personne…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          autoComplete="off"
        />
        <button
          onClick={onCreatePerson}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg
                     hover:bg-blue-700 shadow-md flex-shrink-0"
          title="Ajouter une personne"
        >
          +
        </button>
      </div>

      {/* Résultats */}
      {results.length > 0 && (
        <ul className="mt-1 border border-gray-200 rounded-lg bg-white/95
                       shadow-lg max-h-60 overflow-y-auto">
          {results.map((person) => (
            <li
              key={person.id}
              onClick={() => handleSelect(person)}
              className="px-4 py-2 cursor-pointer hover:bg-blue-50
                         text-gray-800 border-b border-gray-100 last:border-0"
            >
              <span className="font-medium">{person.firstName}</span>{" "}
              {person.lastName}
              <span className="text-xs text-gray-400 ml-2">
                Gén. {person.generation}
              </span>
            </li>
          ))}
        </ul>
      )}

      {/* Aucun résultat */}
      {query.trim().length > 0 && results.length === 0 && (
        <p className="mt-2 text-sm text-gray-300 text-center">
          Aucun résultat pour « {query} »
        </p>
      )}
    </div>
  );
}
