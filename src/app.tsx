import "./app.css";

import { GeninList } from "./genin-list";
import { useGameState } from "./state";
import { VillageContent } from "./village";

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
        <GeninList />
      </div>

      <VillageContent />
    </>
  );
}
