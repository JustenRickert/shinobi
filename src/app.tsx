import "./app.css";

// import { GeninList } from "./genin-list";
import { SelectedHexWindowContent } from "./selected-hex";
import { useGameState, useSetGameState } from "./state";
import { usePointsPerSecond } from "./state/util";
import { World } from "./world";

export function App() {
  const setGameState = useSetGameState();
  const { points, pointsSpent } = useGameState((state) => ({
    points: state.points,
    pointsSpent: state.pointsSpent,
  }));
  const pps = usePointsPerSecond();

  const addPoints = () =>
    setGameState((state) => ({
      ...state,
      points: state.points + 1,
    }));

  return (
    <>
      <World />

      <div id="bottom-panel">
        <div id="left-column" className="window">
          <p>Ryō: {points}</p>
          <p>Ryō per second: {pps}</p>
          <p>Ryō spent: {pointsSpent}</p>
          <button onClick={addPoints}>Click</button>
        </div>

        {/* <TrainShinobi />

        <ShinobiList /> */}

        <div className="window">
          <SelectedHexWindowContent />
        </div>
      </div>

      {/* <GeninList /> */}

      {/* <VillageContent /> */}
    </>
  );
}
