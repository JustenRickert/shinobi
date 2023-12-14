import "./app.css";

import { ShinobiList } from "./shinobi-list";
import { useGameState } from "./state";
import { Village } from "./village";

function usePoints() {
  return useGameState((state) => ({
    points: state.points,
    pointsSpent: state.pointsSpent,
  }));
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
