import { Nature, Village, VillageUpgrade } from "./types";
import { IR, sample, uniqueId } from "./util";

function randomNature(): Nature {
  return sample(Object.values(Nature));
}

export function makeRandomVillage(): Village {
  return {
    id: `village-${uniqueId()}`,
    baseDifficulty: 1,
    nature: randomNature(),
    upgrades: new IR(),
    experienceGiven: 0,
    pointsGiven: 0,
    population: 10,
    missionIds: [],
  };
}

export interface VillageTask {
  difficulty: number;
}

export function availableTasks(village: Village): VillageTask[] {
  return [
    {
      difficulty: 1,
    },
  ];
}

const sharedUpgrades = new IR<string, VillageUpgrade>([
  {
    id: "recruitment",
    cost: 10,
    prerequisites: [],
  },
  {
    id: "higher-level-recruitment",
    cost: 100,
    prerequisites: ["recruitment"],
  },
]);

const earthNatureUpgrades = new IR<string, VillageUpgrade>([
  ...sharedUpgrades.list(),
]);

const fireNatureUpgrades = new IR<string, VillageUpgrade>([
  ...sharedUpgrades.list(),
]);

const lightningNatureUpgrades = new IR<string, VillageUpgrade>([
  ...sharedUpgrades.list(),
]);

const waterNatureUpgrades = new IR<string, VillageUpgrade>([
  ...sharedUpgrades.list(),
]);

const windNatureUpgrades = new IR<string, VillageUpgrade>([
  ...sharedUpgrades.list(),
]);

export const allUpgrades = new IR<string, VillageUpgrade>([
  ...earthNatureUpgrades.list(),
  ...fireNatureUpgrades.list(),
  ...lightningNatureUpgrades.list(),
  ...waterNatureUpgrades.list(),
  ...windNatureUpgrades.list(),
]);

export function natureUpgrades(nature: Nature) {
  switch (nature) {
    case Nature.Earth:
      return earthNatureUpgrades;
    case Nature.Fire:
      return fireNatureUpgrades;
    case Nature.Lightning:
      return lightningNatureUpgrades;
    case Nature.Water:
      return waterNatureUpgrades;
    case Nature.Wind:
      return windNatureUpgrades;
  }
}
