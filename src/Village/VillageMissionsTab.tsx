import { useCallback, useState } from "preact/hooks";

import {
  setAdvanceShinobiTaskActivity,
  setGameState,
  useGameState,
} from "../game";
import { rollMissions } from "../mission";
import type { GameState, MissionId, ShinobiId, VillageId } from "../types";
import { assert, partition } from "../util";

function setVillageMissions(id: VillageId) {
  setGameState((state) => {
    const village = state.villages.get(id);
    const [assignedMissionIds, unassignedMissionIds] = partition(
      (missionId) => Boolean(state.missions.get(missionId).assigned),
      village.missionIds
    );
    console.log({
      assignedMissionIds,
      unassignedMissionIds,
      missionIds: village.missionIds,
    });
    const newMissions = rollMissions({ villageId: id });
    return {
      ...state,
      villages: state.villages.set(id, {
        missionIds: assignedMissionIds.concat(newMissions.map((m) => m.id)),
      }),
      missions: state.missions.remove(unassignedMissionIds).add(newMissions),
    };
  });
}

function getTaskActivityBlockL(id: ShinobiId) {
  return useCallback(
    (state: GameState) => ({
      shinobi: state.shinobi.get(id),
    }),
    [id]
  );
}

function TaskActivityBlock({ id }: { id: ShinobiId }) {
  const { shinobi } = useGameState(getTaskActivityBlockL(id));
  assert(shinobi.activity?.what === "task");
  return (
    <button onClick={() => setAdvanceShinobiTaskActivity(id)}>
      S ({shinobi.activity.ticks}/{shinobi.activity.ticksRequired})
    </button>
  );
}

function villageMissionsL(id: VillageId) {
  return useCallback(
    (state: GameState) => {
      return {
        missions: state.missions.filter((m) => m.villageId === id),
      };
    },
    [id]
  );
}

export function VillageMissionsTab({ id }: { id: VillageId }) {
  const [selectedMissionId, setSelectedMissionId] = useState<"" | MissionId>(
    ""
  );
  const { missions } = useGameState(villageMissionsL(id));

  return (
    <div id="missions-tab">
      <div>
        {/** TODO */}
        {selectedMissionId}
      </div>
      {!missions.length ? (
        <p>No missions :(</p>
      ) : (
        <ul>
          {missions.list().map((m) => (
            <li key={m.id}>
              <button onClick={() => setSelectedMissionId(m.id)}>
                {m.id}, {m.rarity}
              </button>
            </li>
          ))}
        </ul>
      )}
      <button onClick={() => setVillageMissions(id)}>Roll missions</button>
    </div>
  );
}
