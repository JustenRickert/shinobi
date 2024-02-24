import { useCallback } from "preact/hooks";

import "./app.css";

import ShinobiShop from "./ShinobiShop";
import VillagePanel from "./Village/VillagePanel";
import { setActivePanel, useGameState } from "./game";
import { GameState, ShinobiId, VillageId, VillagePanelTab } from "./types";
import ShinobiPanel from "./ShinobiPanel";

function VillageItem({ id }: { id: VillageId }) {
  return (
    <button
      onClick={() =>
        setActivePanel({ what: "village", id, tab: VillagePanelTab.Missions })
      }
    >
      {id}
    </button>
  );
}

function villageListL(state: GameState) {
  return {
    villageIds: state.villages.ids,
  };
}

function VillageList() {
  const { villageIds } = useGameState(villageListL);
  return (
    <ul className="block-list">
      {villageIds.map((id) => (
        <li key={id}>
          <VillageItem id={id} />
        </li>
      ))}
    </ul>
  );
}

function shinobiItemL(id: ShinobiId) {
  return useCallback(
    (state: GameState) => ({
      shinobi: state.shinobi.get(id),
    }),
    [id]
  );
}

function ShinobiItem({ id }: { id: ShinobiId }) {
  const { shinobi } = useGameState(shinobiItemL(id));
  return (
    <>
      <button onClick={() => setActivePanel({ what: "shinobi", id })}>
        {id}
      </button>
      {shinobi.activity && <>({shinobi.activity.what})</>}
    </>
  );
}

function shinobiListL(state: GameState) {
  return {
    shinobiIds: state.shinobi.ids,
  };
}

function ShinobiList() {
  const { shinobiIds } = useGameState(shinobiListL);
  return (
    <ul>
      {shinobiIds.map((id) => (
        <li key={id}>
          <ShinobiItem id={id} />
        </li>
      ))}
    </ul>
  );
}

function ActivePanelSwitch({
  activePanel,
}: {
  activePanel: NonNullable<GameState["ui"]["activePanel"]>;
}) {
  switch (activePanel.what) {
    case "village": {
      return <VillagePanel id={activePanel.id} />;
    }
    case "shinobi":
      return <ShinobiPanel id={activePanel.id} />;
  }
}

function getActivePanelState(state: GameState) {
  return {
    activePanel: state.ui.activePanel,
  };
}

function ActivePanel() {
  const { activePanel } = useGameState(getActivePanelState);

  if (!activePanel) return null;

  return (
    <div id="active-panel" className="card">
      <ActivePanelSwitch activePanel={activePanel} />
    </div>
  );
}

function getGameStatsState(state: GameState) {
  return {
    points: state.points,
    population: state.shinobi.length,
    maxPopulation: state.villages.reduce(
      (population, village) => population + village.population,
      0
    ),
  };
}

function GameStats() {
  const { points, population, maxPopulation } = useGameState(getGameStatsState);
  return (
    <section>
      <b>points</b> {points}
      <> </>
      <b>population</b> {population}/{maxPopulation}
    </section>
  );
}

export function App() {
  return (
    <>
      <GameStats />
      <VillageList />
      <ShinobiList />
      <ShinobiShop />
      <ActivePanel />
    </>
  );
}
