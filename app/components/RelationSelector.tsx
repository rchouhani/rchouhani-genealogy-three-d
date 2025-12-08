"use client";

import { useState } from "react";
import { RelationType as GenRelationType } from "../utils/generation";

interface Props {
  value: GenRelationType;
  onChange: (value: GenRelationType) => void;
}

export default function RelationSelector({ value, onChange }: Props) {
  const [open, setOpen] = useState(false); // ouverture du dropdown
  const [hoveredCategory, setHoveredCategory] = useState<string | null>(null);

  const categories: Record<string, { label: string; value: GenRelationType }[]> = {
    "Relations primaires": [
      { label: "Enfant", value: "child" },
      { label: "Parent", value: "parent" },
      { label: "Frère / Sœur", value: "sibling" },
      { label: "Conjoint(e)", value: "spouse" },
    ],
    "Relations secondaires": [
      { label: "Oncle", value: "uncle" },
      { label: "Tante", value: "aunt" },
      { label: "Cousin(e)", value: "cousin" },
      { label: "Nièce", value: "niece" },
      { label: "Neveu", value: "nephew" },
    ],
    "Famille recomposée": [
      { label: "Beau-père", value: "stepFather" },
      { label: "Belle-mère", value: "stepMother" },
      { label: "Demi-frère", value: "stepBrother" },
      { label: "Demi-sœur", value: "stepSister" },
    ],
    "Par alliance": [
      { label: "Beau-frère", value: "brotherInLaw" },
      { label: "Belle-sœur", value: "sisterInLaw" },
      { label: "Gendre", value: "sonInLaw" },
      { label: "Belle-fille", value: "daughterInLaw" },
    ],
    "Intergénérationnel": [
      { label: "Grand-père", value: "grandFather" },
      { label: "Grand-mère", value: "grandMother" },
      { label: "Grand-oncle", value: "grandUncle" },
      { label: "Grande-tante", value: "grandAunt" },
      { label: "Petit-enfant", value: "grandChild" },
    ],
  };

  return (
    <div className="relative w-64">
      {/* Bouton d'ouverture du menu */}
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="border w-full px-3 py-2 rounded flex justify-between items-center dark:bg-gray-700 dark:text-gray-100"
      >
        {/* {value ? value : "Choisir une relation"} */}

        <span className="text-gray-500">Choisis une relation</span>
      </button>

      {open && (
        <div className="absolute z-20 mt-2 w-full bg-white dark:bg-gray-800 border rounded shadow-lg">
          {Object.entries(categories).map(([categoryName, options]) => (
            <div
              key={categoryName}
              onMouseEnter={() => setHoveredCategory(categoryName)}
              onMouseLeave={() => setHoveredCategory(null)}
            >
              {/* Titre de la catégorie */}
              <div className="px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded font-medium flex justify-between items-center">
                {categoryName}
                <span>▼</span>
              </div>

              {/* Sous-options animées au hover */}
              <div
                className={`overflow-hidden transition-all duration-1500 ${
                  hoveredCategory === categoryName ? "max-h-96" : "max-h-0"
                }`}
              >
                {options.map((opt) => (
                  <div
                    key={opt.value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setHoveredCategory(null);
                    }}
                    className="px-5 py-2 hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer rounded"
                  >
                    {opt.label}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
