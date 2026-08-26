/**
 * @fileoverview Panneau de filtrage des relations affichées.
 *
 * Permet de sélectionner quelles catégories de relations afficher :
 *   - Mes proches (coché par défaut)
 *   - Famille élargie
 *   - Famille recomposée
 *   - Par alliance
 *   - Intergénérationnel
 *
 * Position : en haut à droite, au-dessus du ControlsPanel.
 */

import { RelationFilters } from '../types/scene';

interface FilterPanelProps {
  filters: RelationFilters;
  onChange: (filters: RelationFilters) => void;
}

export default function FilterPanel({ filters, onChange }: FilterPanelProps) {
  /**
   * Toggle un filtre spécifique.
   */
  const handleToggle = (key: keyof RelationFilters) => {
    onChange({
      ...filters,
      [key]: !filters[key],
    });
  };

  return (
    <div className="fixed top-6 right-6 bg-white/95 dark:bg-gray-800/95 p-4 rounded-lg shadow-xl z-10 min-w-[260px]">
      <h3 className="text-sm font-semibold mb-3 text-gray-800 dark:text-gray-100">
        Relations affichées
      </h3>

      <div className="flex flex-col gap-2">
        {/* Mes proches */}
        <label
          htmlFor="filter-proches"
          className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <input
            id="filter-proches"
            type="checkbox"
            checked={filters.proches}
            onChange={() => handleToggle('proches')}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
          <span className="text-gray-700 dark:text-gray-200">
            Mes proches
          </span>
        </label>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-600 my-1" />

        {/* Famille élargie */}
        <label
          htmlFor="filter-elargie"
          className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <input
            id="filter-elargie"
            type="checkbox"
            checked={filters.elargie}
            onChange={() => handleToggle('elargie')}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
          <span className="text-gray-700 dark:text-gray-200">
            Famille élargie
          </span>
        </label>

        {/* Famille recomposée */}
        <label
          htmlFor="filter-recomposee"
          className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <input
            id="filter-recomposee"
            type="checkbox"
            checked={filters.recomposee}
            onChange={() => handleToggle('recomposee')}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
          <span className="text-gray-700 dark:text-gray-200">
            Famille recomposée
          </span>
        </label>

        {/* Par alliance */}
        <label
          htmlFor="filter-alliance"
          className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <input
            id="filter-alliance"
            type="checkbox"
            checked={filters.parAlliance}
            onChange={() => handleToggle('parAlliance')}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
          <span className="text-gray-700 dark:text-gray-200">
            Par alliance
          </span>
        </label>

        {/* Divider */}
        <div className="border-t border-gray-200 dark:border-gray-600 my-1" />

        {/* Intergénérationnel */}
        <label
          htmlFor="filter-intergenerationnel"
          className="flex items-center gap-2 cursor-pointer text-sm hover:bg-gray-50 dark:hover:bg-gray-700 p-2 rounded transition-colors"
        >
          <input
            id="filter-intergenerationnel"
            type="checkbox"
            checked={filters.intergenerationnel}
            onChange={() => handleToggle('intergenerationnel')}
            className="w-4 h-4 accent-blue-600 cursor-pointer"
          />
          <span className="text-gray-700 dark:text-gray-200">
            Intergénérationnel
          </span>
        </label>
      </div>
    </div>
  );
}
