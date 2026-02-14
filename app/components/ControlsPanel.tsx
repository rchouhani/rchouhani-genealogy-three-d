/**
 * @fileoverview Panneau de contrôles de la scène 3D.
 *
 * Boutons disponibles :
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
  isFrozen,
}: ControlsPanelProps) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="bg-blue-500 text-white px-3 py-2 rounded-md hover:bg-blue-600"
        title="Zoom avant"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="bg-red-500 text-white px-3 py-2 rounded-md hover:bg-red-600"
        title="Zoom arrière"
      >
        -
      </button>
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
