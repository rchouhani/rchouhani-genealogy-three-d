"use client";

import { useState } from "react";
import { Person } from "../types/family";

interface SearchEngineProps {
  persons: Person[];
  onSelectPerson: (person: Person) => void;
  onCreatePerson: () => void;
}

export default function SearchEngine({
  persons,
  onSelectPerson,
  onCreatePerson,
}: SearchEngineProps) {
  const [query, setQuery] = useState("");
  const [error, setError] = useState("");

  const results = persons.filter((p) => {
    const full = `${p.firstName} ${p.lastName}`.toLowerCase();
    return full.includes(query.toLowerCase());
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length === 0) {
      setError("");
      return;
    }

    if (results.length === 0) {
      setError("Aucun résultat trouvé.");
    } else {
      setError("");
    }
  };

  const handleSelect = (person: Person) => {
    setQuery("");
    setError("");
    onSelectPerson(person);
  };

  const showCreateButton = persons.length === 0 || persons.length < 20;

  return (
    <div className="w-full max-w-md mx-auto p-4 bg-white rounded shadow-lg">
      <div className="flex items-center gap-3 mb-2">
        <input
          type="text"
          className="w-full p-2 border rounded text-gray-500"
          placeholder="Rechercher une personne…"
          value={query}
          onChange={handleChange}
        />

        {showCreateButton && (
          <button
            onClick={onCreatePerson}
            className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            +
          </button>
        )}
      </div>

      {/* Message d’erreur */}
      {error && <p className="text-red-600 text-sm mb-2">{error}</p>}

      {/* Résultats */}
      {query.length > 0 && results.length > 0 && (
        <ul className="border rounded bg-gray-50 max-h-60 overflow-y-auto">
          {results.map((person) => (
            <li
              key={person.id}
              onClick={() => handleSelect(person)}
              className="p-2 cursor-pointer hover:bg-gray-200"
            >
              {person.firstName} {person.lastName}
            </li>
          ))}
        </ul>
      )}

      {/* Aucun résultat */}
      {query.length > 0 && results.length === 0 && !error && (
        <p className="text-gray-600 text-sm">Aucun résultat.</p>
      )}
    </div>
  );
}
