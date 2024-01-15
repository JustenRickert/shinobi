import { createContext } from "preact";
import {
  ReactNode,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "preact/compat";
import {
  EMPTY,
  Observable,
  Subject,
  distinctUntilChanged,
  identity,
  map,
  merge,
  startWith,
  tap,
} from "rxjs";
import { mergeDeepRight } from "ramda";

import { IR, shallowEqual } from "../util";
import { SAVE_STATE_KEY } from "../constant";
import { Hex } from "../grid";
import * as Genin from "./genin";
import * as Shinobi from "./shinobi";
import * as ShinobiInTraining from "./shinobi-in-training";
import * as Task from "./task";
import * as WorldHex from "./world-hex";

export { Genin, Shinobi, ShinobiInTraining, Task, WorldHex };

export interface GameState {
  points: number;
  pointsSpent: number;
  population: number;
  shinobi: IR.T<Shinobi.Id, Shinobi.T>;
  genin: {
    ids: Genin.Id[];
    record: Record<Genin.Id, Genin.T>;
  };
  lastGraduationAt: number;
  shinobiInTraining: IR.T<ShinobiInTraining.Id, ShinobiInTraining.T>;
  village: {
    tasks: {
      ids: Task.Id[];
      record: Record<Task.Id, Task.T>;
    };
  };
  ui: {
    selectedHex: "" | Hex.Id;
  };
  world: IR.T<Hex.Id, WorldHex.T>;
}

const GameContext = createContext<{
  state$: Observable<GameState>;
  update: (reducer: (state: GameState) => GameState) => void;
}>({
  state$: EMPTY,
  update: () => {},
});

const villageHex = WorldHex.make({ hex: Hex.ORIGIN, what: "village" });

const initialState: GameState = {
  points: 100,
  pointsSpent: 0,
  shinobi: IR.add(Shinobi.make(), IR.make<Shinobi.Id, Shinobi.T>()),

  ui: {
    selectedHex: "",
  },

  world: IR.make([
    villageHex,
    ...Hex.ring(1, villageHex).map((hex) =>
      WorldHex.make({ hex, what: "forest" })
    ),
  ]),

  // OLD?
  population: 10,
  genin: {
    ids: [],
    record: {},
  },
  lastGraduationAt: Date.now(),
  shinobiInTraining: IR.add(
    ShinobiInTraining.make(),
    IR.make<ShinobiInTraining.Id, ShinobiInTraining.T>()
  ),
  village: {
    tasks: {
      ids: [],
      record: {},
    },
  },
};

function getDefaultGameState(): GameState {
  const savedState = JSON.parse(
    window.localStorage.getItem(SAVE_STATE_KEY) ?? "null"
  ) as null | GameState;
  if (!savedState) return initialState;
  return mergeDeepRight(initialState, savedState);
}

let __game_state__ = getDefaultGameState();

const gameSubject = new Subject<GameState>();

export function getGameState() {
  return __game_state__;
}

function setGameState(state: GameState) {
  __game_state__ = state;
  gameSubject.next(state);
}

export type GameEffectAction = Observable<
  void | ((state: GameState) => void | GameState)
>;

export type GameEffect = (state$: Observable<GameState>) => GameEffectAction;

export function runGameEffects(effects: GameEffect[]) {
  const update$ = merge(
    ...effects.map((effect) =>
      effect(gameSubject.asObservable().pipe(startWith(getGameState())))
    )
  );
  return update$.subscribe((reducer) => {
    if (!reducer) return;
    const nextState = reducer(getGameState());
    if (!nextState) return;
    setGameState(nextState);
  });
}

export function getGameStateStream() {
  return gameSubject.asObservable();
}

export function GameProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      state$: getGameStateStream(),
      update: (reducer: (state: GameState) => GameState) =>
        setGameState(reducer(getGameState())),
    }),
    []
  );
  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useSetGameState() {
  return useContext(GameContext).update;
}

export function useGameStateStream() {
  const { state$ } = useContext(GameContext);
  return state$;
}

export function useGameState<T>(getter: (state: GameState) => T, debug?: any) {
  const state$ = useGameStateStream();
  const [local, setLocal] = useState(() => getter(getGameState()));

  useEffect(() => {
    const sub = state$
      .pipe(
        map(getter),
        distinctUntilChanged((s1, s2) => shallowEqual(s1, s2)),
        debug ? tap(() => console.log(debug)) : identity
      )
      .subscribe((s) => setLocal(s));
    return () => {
      sub.unsubscribe();
    };
  }, [state$]);

  return local;
}

// TODO Having this is nice for dev server, but doesn't work with jest. (Very
// annoying.) Might be possible to work by not using type="module" in
// `package.json` I dunno. Not super important maybe
if (import.meta.hot) {
  import.meta.hot.accept(() => {
    console.log("HIT THAT SUH");
    // better way? Probably not.
    window.location.reload();
  });
}
