import { memo } from "preact/compat";
import { useCallback, useState } from "preact/hooks";

import { setGameState, useGameState } from "../game";
import { rollMissions } from "../mission";
import type { GameState, MissionId, VillageId } from "../types";
import { partition } from "../util";

function setRollVillageMissions(id: VillageId) {
  // TODO this should cost points. How much?
  setGameState((state) => {
    const village = state.villages.get(id);
    const [assignedMissionIds, unassignedMissionIds] = partition(
      (missionId) => Boolean(state.missions.get(missionId).assigned),
      village.missionIds
    );
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

function selectedMissionL(missionId: "" | MissionId) {
  return useCallback(
    (state: GameState) => {
      const mission = !missionId ? null : state.missions.get(missionId);
      return {
        mission,
      };
    },
    [missionId]
  );
}

function SelectedMission({ id }: { id: "" | MissionId }) {
  const { mission } = useGameState(selectedMissionL(id));
  if (!mission) return <div>Select a mission</div>;
  return (
    <div>
      <h5>
        {mission.id.slice(8)}, {mission.rarity}, level {mission.difficulty}
      </h5>
    </div>
  );
}

function villageMissionsL(id: VillageId) {
  return useCallback(
    (state: GameState) => {
      const village = state.villages.get(id);
      return {
        missions: state.missions.subset(village.missionIds),
      };
    },
    [id]
  );
}

function VillageMissionsTab({ id }: { id: VillageId }) {
  const [selectedMissionId, setSelectedMissionId] = useState<"" | MissionId>(
    ""
  );
  const { missions } = useGameState(villageMissionsL(id));

  return (
    <div id="missions-tab">
      <div>
        {/** TODO */}
        <SelectedMission id={selectedMissionId} />
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
      <button
        onClick={() => {
          // TODO having these states separate causes an error because updates
          // happen asynchronously at different times. Should probably have
          // these both in global state
          setSelectedMissionId("");
          setRollVillageMissions(id);
        }}
      >
        Roll missions
      </button>
    </div>
  );
}

export default memo(VillageMissionsTab);
