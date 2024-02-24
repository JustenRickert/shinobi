import { IR } from "./util";

export interface TaskActivity {
  what: "task";
  villageId: VillageId;
  since: number;
  ticks: number;
  points: number;
  ticksRequired: number;
  difficulty: number;
}

export type ShinobiId = `shinobi-${string}`;

export interface Shinobi {
  id: ShinobiId;
  villageId: "" | VillageId;
  level: number;
  nature: Nature;
  cost: number;
  experience: number;
  activity:
    | null
    | {
        what: "exploration";
        since: number;
      }
    | TaskActivity;
}

export type VillageId = `village-${string}`;

export enum Nature {
  Earth = "earth",
  Fire = "fire",
  Lightning = "lightning",
  Water = "water",
  Wind = "wind",
}

export type VillageUpgradeId = string;

export interface VillageUpgrade {
  id: VillageUpgradeId;
  cost: number;
  prerequisites: VillageUpgradeId[];
}

export interface VillageUpgradeState {
  id: VillageUpgradeId;
  gameTime: number;
}

export interface Village {
  id: VillageId;
  /**
   * Current idea is to have village upgrade paths separated by
   * `ShinobiChakraNature`.
   */
  nature: Nature;
  /**
   * I think how this will work is this: Each village has a `baseDifficulty`,
   * and each `Task` has a `difficulty`. The overall difficulty according to a
   * `Shinobi` will be `baseDifficulty + difficulty - Shinobi['level']`.
   */
  baseDifficulty: number;
  upgrades: IR<string, VillageUpgradeState>;
  pointsGiven: number;
  experienceGiven: number;
  /**
   * `population` is the amount of additional `shinobi` user can max out to
   */
  population: number;
  missionIds: MissionId[];
}

export interface Shop {
  lastRolledTime: number;
  rollCost: number;
  shinobi: IR<ShinobiId, Shinobi>;
}

export enum VillagePanelTab {
  Missions = "missions",
  Upgrades = "upgrades",
}

export interface GameState {
  points: number;
  shinobi: IR<ShinobiId, Shinobi>;
  villages: IR<VillageId, Village>;
  shop: Shop;
  missions: IR<MissionId, Mission>;

  gameTime: number; // measured in ticks

  ui: {
    activePanel:
      | null
      | {
          what: "village";
          id: VillageId;
          tab: VillagePanelTab;
        }
      | { what: "shinobi"; id: ShinobiId };
  };
}

export type MissionId = `mission-${string}`;

export type Rarity = "common" | "uncommon" | "rare";

export interface Mission {
  id: MissionId;
  rarity: Rarity;
  villageId: VillageId;
  difficulty: number;
  assigned: null | {
    shinobiId: string;
  };
}
