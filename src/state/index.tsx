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
  from,
  identity,
  map,
  mergeAll,
  tap,
} from "rxjs";
import { IR, shallowEqual } from "../util";

import * as Genin from "./genin";
import * as Task from "./task";
import * as ShinobiInTraining from "./shinobi-in-training";

export { Genin, Task, ShinobiInTraining };

export interface GameState {
  points: number;
  pointsSpent: number;
  genin: {
    ids: Genin.Id[];
    record: Record<Genin.Id, Genin.T>;
  };
  shinobiInTraining: IR.T<ShinobiInTraining.Id, ShinobiInTraining.T>;
  village: {
    tasks: {
      ids: Task.Id[];
      record: Record<Task.Id, Task.T>;
    };
  };
}

const GameContext = createContext<{
  state$: Observable<GameState>;
  update: (reducer: (state: GameState) => GameState) => void;
}>({
  state$: EMPTY,
  update: () => {},
});

let __game_state__: GameState = {
  points: 100,
  pointsSpent: 0,
  genin: {
    ids: [],
    record: {},
  },
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

const gameSubject = new Subject<GameState>();

function getGameState() {
  return __game_state__;
}

function setGameState(state: GameState) {
  __game_state__ = state;
  gameSubject.next(state);
}

export type GameEffect = (
  state$: Observable<GameState>
) => Observable<void | ((state: GameState) => void | GameState)>;

export function runGameEffects(effects: GameEffect[]) {
  const update$ = from(
    effects.map((effect) => effect(gameSubject.asObservable()))
  ).pipe(mergeAll());
  return update$.subscribe((reducer) => {
    if (!reducer) return;
    const nextState = reducer(getGameState());
    if (!nextState) return;
    setGameState(nextState);
  });
}

export function GameProvider({ children }: { children: ReactNode }) {
  const value = useMemo(
    () => ({
      state$: gameSubject.asObservable(),
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
