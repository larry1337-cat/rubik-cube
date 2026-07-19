import { Scene } from "./three/Scene";
import { Controls } from "./ui/Controls";
import { SolvedCelebration } from "./ui/SolvedCelebration";
import { SoundEffects } from "./audio/SoundEffects";
import "./styles.css";

export default function App() {
  return (
    <div className="app">
      <div className="app__canvas">
        <Scene />
      </div>
      <Controls />
      <SolvedCelebration />
      <SoundEffects />
    </div>
  );
}
