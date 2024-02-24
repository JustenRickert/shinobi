import { range } from "ramda";
import { Mission, VillageId } from "./types";
import { uniqueId } from "./util";

export function makeRandomMission({
  villageId,
}: {
  villageId: VillageId;
}): Mission {
  return {
    id: `mission-${uniqueId()}`,
    rarity: "common",
    villageId,
    difficulty: 1,
    assigned: null,
  };
}

export function rollMissions({ villageId }: { villageId: VillageId }) {
  return range(0, 2).map(() => makeRandomMission({ villageId }));
}
