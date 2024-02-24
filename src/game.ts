import { useEffect, useState } from "preact/hooks";
import { lensPath, range, reduce, set } from "ramda";
import { Subject, distinctUntilChanged, map } from "rxjs";

import {
  DeepPartial,
  IR,
  assert,
  deepMerge,
  deviationInt,
  randomInt,
  sample,
  shallowEqual,
  thru,
  uniqueId,
} from "./util";
import { SAVE_STATE_KEY } from "./constant";
import {
  GameState,
  Mission,
  MissionId,
  Nature,
  Shinobi,
  ShinobiId,
  Shop,
  TaskActivity,
  Village,
  VillageId,
} from "./types";
import { makeRandomVillage } from "./village";
import { makeRandomMission } from "./mission";

function makeShinobi({
  level = 1,
  nature = sample(Object.values(Nature)),
  villageId = "",
}: {
  level?: number;
  nature?: Nature;
  villageId?: "" | VillageId;
} = {}): Shinobi {
  return {
    id: `shinobi-${uniqueId()}`,
    nature,
    villageId,
    level,
    experience: 0,
    activity: null,
    cost: deviationInt(10, 0.1),
  };
}

function makeDefaultShinobiIR() {
  const s = makeShinobi();
  return new IR<ShinobiId, Shinobi>(
    { [s.id]: s },
    { debugName: "default-shinobi" }
  );
}

export function makeTaskActivity({
  shinobiId,
  villageId,
}: {
  shinobiId: ShinobiId;
  villageId: VillageId;
}): TaskActivity {
  const { gameTime, villages, shinobi } = getGameState();
  const v = villages.get(villageId);
  const s = shinobi.get(shinobiId);
  const difficulty = 1;
  const pointsRate = Math.pow(1.1, v.baseDifficulty + difficulty - s.level - 1);
  const ticksRequiredRate = Math.pow(
    1.1,
    v.baseDifficulty + difficulty - s.level - 1
  );
  return {
    what: "task",
    villageId,
    since: gameTime,
    ticks: 1,
    difficulty,
    points: deviationInt(5 * pointsRate, 0.15),
    ticksRequired: deviationInt(15 * ticksRequiredRate, 0.15),
  };
}

function makeDefaultVillageIR() {
  const v = makeRandomVillage();
  return new IR<VillageId, Village>(
    { [v.id]: v },
    { debugName: "default-village" }
  );
}

export function sampleShinobi(n: number) {
  const state = getGameState();

  const options = state.villages.reduce(
    (options, v) =>
      v.upgrades.has("recruitment")
        ? options.concat({
            level: 1,
            nature: v.nature,
          })
        : options,
    [] as { level: number; nature: Nature }[]
  );

  if (!options.length) return new IR<ShinobiId, Shinobi>();

  return new IR<ShinobiId, Shinobi>(
    range(0, n).map(() => makeShinobi(sample(options))),
    { debugName: "rolled-shinobi" }
  );
}

export function makeRollCost() {
  return deviationInt(25, 1 / 5);
}

export function calcActivityExperience(id: ShinobiId) {
  const state = getGameState();
  switch (state.shinobi.get(id).activity?.what) {
    case undefined:
      fail("Shouldn't calculate activity experience with a `null` activity");
    case "task":
      // TODO dynamic calculation?
      // const village = state.villages.get(activity.villageId);
      // activity
      // village.difficulty;
      return randomInt(1, 5);
  }
  throw new Error("not impl");
}

function makeDefaultShop(): Shop {
  return {
    rollCost: makeRollCost(),
    lastRolledTime: 0,
    shinobi: new IR(),
  };
}

function makeDefaultMissions() {
  return new IR<MissionId, Mission>();
}

const defaultVillages = makeDefaultVillageIR();

const defaultGameState: GameState = {
  points: 0,
  shinobi: makeDefaultShinobiIR(),
  villages: makeDefaultVillageIR(),
  shop: makeDefaultShop(),
  missions: makeDefaultMissions(),

  gameTime: 0,
  ui: {
    activePanel: null,
  },
};

export function serializeGameState(state: GameState) {
  return Object.entries(state).reduce((state, [key, value]) => {
    if (value && typeof value === "object" && !Array.isArray(value))
      state[key] = serializeGameState(value);
    else if (value instanceof Map)
      state[key] = {
        "@type": "Map",
        value: Array.from(value.entries()),
      };
    else state[key] = value;
    return state;
  }, {} as Record<any, any>) as object;
}

function deserializeGameState(state: object) {
  return Object.entries(state).reduce((state, [key, value]) => {
    if (
      value === null ||
      ["string", "number"].some(
        (primitiveType) => typeof value === primitiveType
      ) ||
      Array.isArray(value)
    ) {
      state[key] = value;
      return state;
    }
    if (IR.isSerializedIR(value)) {
      state[key] = new IR(value);
      return state;
    }
    if (typeof value === "object") {
      if (value["@type"] === "Map") state[key] = new Map(value);
      state[key] = deserializeGameState(value);
      return state;
    }
    console.error({ state, key, value });
    throw new Error("bad impl");
  }, {} as Record<string, any>) as GameState;
}

function makeInitialGameState(): GameState {
  const storedState = JSON.parse(
    localStorage.getItem(SAVE_STATE_KEY) ?? "null"
  );
  if (storedState) return deserializeGameState(storedState);
  return defaultGameState;
}

let __gameState__ = makeInitialGameState();

if (process.env.NODE_ENV === "development") {
  if (!("missions" in __gameState__)) {
    // @ts-expect-error
    __gameState__.missions = makeDefaultMissions();
  }
  for (const v of __gameState__.villages.list()) {
    v.missionIds = [];
    if (v.upgrades instanceof Map || IR.isSerializedIR(v.upgrades))
      __gameState__.villages.record[v.id].upgrades = new IR();
    __gameState__.villages.record[v.id] = deepMerge(makeRandomVillage(), v);
  }
  for (const s of __gameState__.shinobi.list()) {
    if (s.activity?.what === "task" && isNaN(s.activity.ticksRequired)) {
      __gameState__.shinobi.record[s.id] = deepMerge(makeShinobi(), s);
    }
    if (!("villageId" in s)) {
      // @ts-expect-error
      s.villageId = "";
    }
  }
}

export const gameState$ = new Subject<GameState>();

function getGameState() {
  return __gameState__;
}

export function setGameState(
  gameState: GameState | ((gameState: GameState) => GameState)
) {
  if (gameState instanceof Function) {
    __gameState__ = gameState(__gameState__);
    gameState$.next(__gameState__);
    return;
  }
  if (gameState === __gameState__) return; // TODO is this right?
  __gameState__ = gameState;
  gameState$.next(__gameState__);
}

export function setActivePanel(activePanel: GameState["ui"]["activePanel"]) {
  setGameState(set(lensPath(["ui", "activePanel"]), activePanel));
}

export function setShinobiActivity(
  id: ShinobiId,
  activity: NonNullable<Shinobi["activity"]>
) {
  setGameState((state) => {
    switch (activity.what) {
      case "task":
        return {
          ...state,
          shinobi: state.shinobi.update(id, (s) => ({
            ...s,
            activity,
          })),
        };
      default:
        throw new Error("not impl");
    }
  });
}

export function useGameState<S>(
  getter: (gameState: GameState) => S,
  options: { debugMessage?: any } = {}
) {
  const [local, setLocal] = useState(() => getter(getGameState()));

  useEffect(() => {
    const state = getter(getGameState());
    if (local !== state) setLocal(state);
    const sub = gameState$
      .pipe(
        map(getter),
        distinctUntilChanged((s1, s2) => shallowEqual(s1, s2))
      )
      .subscribe((s) => {
        if (options.debugMessage) {
          console.log(options.debugMessage);
        }
        setLocal(s);
      });
    return () => {
      sub.unsubscribe();
    };
  }, [getter]);

  return local;
}

function isCompletedTaskActivity(activity: TaskActivity) {
  return activity.ticks >= activity.ticksRequired;
}

function completeShinobiTaskActivity(
  id: ShinobiId,
  state: GameState
): GameState {
  const s = state.shinobi.get(id);
  assert(s.activity?.what === "task");
  const { points } = s.activity;
  const experience = calcActivityExperience(id);
  return {
    ...state,
    points: state.points + points,
    villages: state.villages.update(s.activity.villageId, (v) => ({
      ...v,
      experienceGiven: v.experienceGiven + experience,
      pointsGiven: v.pointsGiven + points,
    })),
    shinobi: state.shinobi.update(id, (s) => ({
      experience: s.experience + experience,
      activity: null,
    })),
  };
}

function stepShinobiTaskActivity(s: Shinobi): DeepPartial<Shinobi> {
  assert(s.activity?.what === "task");
  return {
    activity: {
      ticks: s.activity.ticks + 1,
    } as TaskActivity,
  };
}

export function setAdvanceShinobiTaskActivity(id: ShinobiId) {
  setGameState((state) => {
    const s = state.shinobi.get(id);
    assert(s.activity?.what === "task");
    if (isCompletedTaskActivity(s.activity))
      return completeShinobiTaskActivity(id, state);
    return {
      ...state,
      shinobi: state.shinobi.update(id, stepShinobiTaskActivity),
    };
  });
}

function stepActivities(state: GameState): GameState {
  return state.shinobi.reduce((state, s) => {
    if (!s.activity) return state;
    switch (s.activity.what) {
      case "task": {
        if (!isCompletedTaskActivity(s.activity))
          return {
            ...state,
            shinobi: state.shinobi.update(s.id, stepShinobiTaskActivity),
          };

        return completeShinobiTaskActivity(s.id, state);
      }

      default:
        throw new Error("not impl");
    }
  }, state);
}

interface AmbientPointProductionUpdate {
  shinobiId: ShinobiId;
  villageId: VillageId;
  points: number;
  experience: number;
}

function stepAmbientPointProduction(state: GameState) {
  const updates = state.shinobi.reduce((updates, s) => {
    if (!s.villageId) return updates;
    updates.push({
      shinobiId: s.id,
      villageId: s.villageId,
      points: 1,
      experience: 1,
    });
    return updates;
  }, [] as AmbientPointProductionUpdate[]);

  return reduce(
    (state, { points, experience, shinobiId, villageId }) =>
      deepMerge(state, {
        points: state.points + points,
        shinobi: state.shinobi.update(shinobiId, (s) => ({
          experience: s.experience + experience,
        })),
        villages: state.villages.update(villageId, (v) => ({
          pointsGiven: v.pointsGiven + points,
        })),
      }),
    state,
    updates
  );
}

export function step(lastGameState: GameState): GameState {
  const state = thru(lastGameState, stepActivities, stepAmbientPointProduction);

  return {
    ...state,
    gameTime: state.gameTime + 1,
  };
}
