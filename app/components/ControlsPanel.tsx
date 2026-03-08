/**
 * @fileoverview Panneau de contrôles de la scène 3D.
 *
 * Boutons disponibles :
 *   - Ajouter membre (+) — en haut
 *   - Zoom in  (+)
 *   - Zoom out (-)
 *   - Freeze   → désactive click + zoom + pan (hover reste actif)
 *   - Reset    → sort du freeze + réinitialise la vue
 */

import { ControlsPanelProps } from "../types/scene";

export default function ControlsPanel({
  onZoomIn,
  onZoomOut,
  onFreeze,
  onReset,
  onAddMember,
  isFrozen,
}: ControlsPanelProps) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2">
      {/* Bouton Ajouter membre — au-dessus des autres */}
      <button
        onClick={onAddMember}
        className="bg-blue-600 text-white w-10 h-10 rounded-full shadow-lg 
                   hover:bg-blue-700 text-xl flex items-center justify-center
                   mb-2"
        title="Ajouter un membre"
      >
        +
      </button>

      {/* Divider visuel */}
      <div className="border-t border-gray-400 mb-1" />

      {/* Zoom in */}
      <button
        onClick={onZoomIn}
        className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"
        title="Zoom avant"
      >
        +
      </button>

      {/* Zoom out */}
      <button
        onClick={onZoomOut}
        className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
        title="Zoom arrière"
      >
        -
      </button>

      {/* Freeze */}
      <button
        onClick={onFreeze}
        className={`px-3 py-2 rounded-md text-white transition-colors ${
          isFrozen
            ? "bg-orange-500 hover:bg-orange-600 ring-2 ring-orange-300"
            : "bg-gray-500 hover:bg-gray-600"
        }`}
        title={isFrozen ? "Scène figée — cliquer pour reprendre" : "Figer la scène"}
      >
        {isFrozen ? "❄️ Figé" : "Figer"}
      </button>

      {/* Reset */}
      <button
        onClick={onReset}
        className="bg-gray-700 text-white px-3 py-2 rounded-md hover:bg-gray-800"
        title="Réinitialiser la vue"
      >
        Reset
      </button>
    </div>
  );
}
