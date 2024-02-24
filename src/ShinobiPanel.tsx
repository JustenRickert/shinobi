import { useCallback } from "preact/hooks";
import { memo } from "preact/compat";

import { ShinobiId, GameState, VillageId } from "./types";
import { setGameState, useGameState } from "./game";

function getShinobiPanelState(id: ShinobiId) {
  return useCallback(
    (state: GameState) => {
      const shinobi = state.shinobi.get(id);
      return {
        shinobi,
        village: shinobi.villageId
          ? state.villages.get(shinobi.villageId)
          : null,
        villageIds: state.villages.ids,
      };
    },
    [id]
  );
}

function setShinobiVillageId(id: ShinobiId, villageId: "" | VillageId) {
  setGameState((state) => ({
    ...state,
    shinobi: state.shinobi.set(id, {
      villageId,
    }),
  }));
}

function ShinobiPanel({ id }: { id: ShinobiId }) {
  const { shinobi, village, villageIds } = useGameState(
    getShinobiPanelState(id)
  );
  return (
    <>
      <h4>Shinobi {shinobi.id}</h4>
      <p>
        <b>experience</b> {shinobi.experience}
        <br />
        <b>assigned village</b> {village ? village.id : "none"}
        <select
          onChange={(e) =>
            // @ts-expect-error
            setShinobiVillageId(id, e.target.value)
          }
        >
          <option value="">none</option>
          {villageIds.map((villageId) => (
            <option value={villageId}>{villageId}</option>
          ))}
        </select>
      </p>
    </>
  );
}

export default memo(ShinobiPanel);
