import "./app.css";

import { useGameState } from "./state";
import { Village } from "./village";

function usePoints() {
  return useGameState((state) => ({
    points: state.points,
    pointsSpent: state.pointsSpent,
  }));
}

function ShinobiList() {
  const { shinobi } = useGameState((state) => ({
    shinobi: state.shinobi.ids.map((id) => state.shinobi.record[id]),
  }));
  return (
    <ul id="shinobi-list">
      {shinobi.map((s) => (
        <li key={s.id}>
          {s.name} ({s.assignedTask?.id})
        </li>
      ))}
    </ul>
  );
}

export function App() {
  const { points, pointsSpent } = usePoints();
  return (
    <>
      <div id="left-column">
        <p>points: {points}</p>
        <p>spent: {pointsSpent}</p>
        <ShinobiList />
      </div>

      <Village />
    </>
  );
}
