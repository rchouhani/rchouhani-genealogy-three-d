import ControlsPanel from "./components/ControlsPanel";
import TreeScene from "./components/TreeScene";

export default function Home() {
  return (
    <main className="relative">
      <TreeScene />
      <ControlsPanel />
    </main>
  );
}
