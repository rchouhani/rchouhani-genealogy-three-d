import { ControlsPanelProps } from "../types/family";

export default function ControlsPanel({
  onZoomIn,
  onZoomOut,
  onReset,
}: ControlsPanelProps) {
  return (
    <div className="fixed bottom-6 right-6 flex flex-col gap-2">
      <button
        onClick={onZoomIn}
        className="bg-blue-500 text-white px-3 py-2 rounded-md"
      >
        +
      </button>
      <button
        onClick={onZoomOut}
        className="bg-red-500 text-white px3 py-2 rounded-md"
      >
        -
      </button>
      <button
        onClick={onReset}
        className="bg-red-500 text-white px3 py-2 rounded-md"
      >
        Reset
      </button>
    </div>
  );
}
