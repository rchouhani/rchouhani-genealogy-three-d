"use client";

import { Person } from "../types/family";

interface HoverInfoTooltipProps {
  person: Person;
  /** Position écran (client X/Y) capturée au moment où le survol a commencé. */
  position: { x: number; y: number };
  onEdit: () => void;
  onAddRelative: () => void;
  onDelete: () => void;
}

/**
 * Infobulle d'info + actions rapides, affichée au survol d'un point.
 *
 * Différences volontaires avec l'ancienne PersonDetailModal :
 *   - PAS de fond plein écran (`fixed inset-0`) : ce fond bloquait TOUT
 *     événement souris sur le canvas dès l'ouverture, empêchant la
 *     détection de "la souris a quitté le point" — d'où la caméra qui
 *     restait bloquée en position inclinée après un survol.
 *   - PAS de bouton "fermer" : la fermeture est entièrement automatique,
 *     pilotée par TreeScene (onHoverPerson(null) quand la souris quitte
 *     le point) — se comporte comme une vraie infobulle, pas une fenêtre.
 *   - Positionnée près du CURSEUR (position capturée une seule fois au
 *     début du survol, pas suivie en continu pour éviter de re-render
 *     à chaque mousemove).
 */
export default function HoverInfoTooltip({
  person,
  position,
  onEdit,
  onAddRelative,
  onDelete,
}: HoverInfoTooltipProps) {
  return (
    <div
      className="fixed z-20 bg-white/95 dark:bg-gray-800/95 rounded-lg shadow-xl px-3 py-2 pointer-events-auto"
      style={{ left: position.x + 16, top: position.y + 16 }}
    >
      <p className="text-sm font-medium text-gray-800 dark:text-gray-100 mb-1 whitespace-nowrap">
        {person.firstName} {person.lastName}
      </p>

      <div className="flex gap-1">
        <button
          type="button"
          onClick={onEdit}
          title="Modifier"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm"
        >
          ✎
        </button>
        <button
          type="button"
          onClick={onAddRelative}
          title="Ajouter un proche"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-200 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-300 text-sm"
        >
          +
        </button>
        <button
          type="button"
          onClick={onDelete}
          title="Supprimer"
          className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-100 dark:hover:bg-red-900/40 text-red-500 text-sm"
        >
          🗑
        </button>
      </div>
    </div>
  );
}
