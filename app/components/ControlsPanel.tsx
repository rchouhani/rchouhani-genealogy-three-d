/**
 * @fileoverview Panneau de contrôles pour la scène 3D.
 *
 * Affiche 3 boutons :
 *   - Zoom in  (+)
 *   - Zoom out (-)
 *   - Reset    (Reset)
 *
 * Positionné en bas à droite de l'écran.
 */

import { ControlsPanelProps } from "../types/scene";

export default function ControlsPanel({
  onZoomIn,
  onZoomOut,
  onReset,
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
        onClick={onReset}
        className="bg-gray-500 text-white px-3 py-2 rounded-md hover:bg-gray-600"
        title="Réinitialiser la vue"
      >
        Reset
      </button>
    </div>
  );
}
