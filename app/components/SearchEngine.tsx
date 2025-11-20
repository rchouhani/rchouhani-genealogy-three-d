"use client";

import { useState, useEffect } from "react";
import { Person } from "../types/family"; // ← adapte selon ton projet

interface SearchEngineProps {
  persons: Person[];                      // Toute la liste des personnes
  onSelectPerson: (person: Person) => void; // Lorsqu’on clique sur une personne trouvée
  onCreatePerson: () => void;               // Ouvre AddMemberForm
}

export default function SearchEngine({
  persons,
  onSelectPerson,
  onCreatePerson,
}: SearchEngineProps) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Person[]>([]);

  useEffect(() => {
    if (!query.trim()) {
      setResults([]);
      return;
    }

    const q = query.toLowerCase();
    const filtered = persons.filter(
      (p) =>
        p.firstName.toLowerCase().includes(q) ||
        p.lastName.toLowerCase().includes(q)
    );

    setResults(filtered);
  }, [query, persons]);

  const hasPersons = persons.length > 0;
  const showPlusButton = persons.length > 0 && persons.length < 20;

  return (
    <div className="w-full max-w-xl mx-auto mt-10 relative">

      {/* Champ de recherche */}
      <div className="flex items-center gap-2">
        <input
          type="text"
          placeholder={
            hasPersons
              ? "Rechercher une personne…"
              : "Aucune entrée pour le moment"
          }
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full border px-4 py-3 rounded-xl shadow-sm dark:bg-gray-800 dark:text-gray-200"
        />

        {/* Bouton + seulement si entre 1 et 20 personnes */}
        {showPlusButton && (
          <button
            onClick={onCreatePerson}
            className="
              w-10 h-10 flex items-center justify-center rounded-xl
              bg-blue-600 text-white text-2xl font-bold shadow
              hover:bg-blue-700 transition
            "
          >
            +
          </button>
        )}
      </div>

      {/* Aucun membre encore → Gros bouton central */}
      {!hasPersons && (
        <div className="mt-4 flex justify-center">
          <button
            onClick={onCreatePerson}
            className="
              px-6 py-3 rounded-xl bg-green-600 text-white font-semibold
              shadow-lg hover:bg-green-700 transition text-lg
            "
          >
            Ajouter votre premier membre
          </button>
        </div>
      )}

      {/* Résultats de recherche */}
      {results.length > 0 && (
        <div
          className="
            absolute left-0 right-0 mt-2 bg-white dark:bg-gray-700 
            border rounded-xl shadow-lg max-h-60 overflow-y-auto z-20
          "
        >
          {results.map((person) => (
            <div
              key={person.id}
              className="px-4 py-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600"
              onClick={() => {
                onSelectPerson(person);
                setQuery("");
                setResults([]);
              }}
            >
              {person.firstName} {person.lastName}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
