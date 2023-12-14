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
import { shallowEqual } from "../util";

import * as Shinobi from "./shinobi";
import * as Task from "./task";

export { Shinobi, Task };

export interface GameState {
  points: number;
  pointsSpent: number;
  shinobi: {
    ids: Shinobi.Id[];
    record: Record<Shinobi.Id, Shinobi.T>;
  };
  village: {
    shinobiInTraining: Shinobi.T[];
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
  shinobi: {
    ids: [],
    record: {},
  },
  village: {
    shinobiInTraining: [Shinobi.make()],
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
) => Observable<(state: GameState) => GameState>;

export function runGameEffects(effects: GameEffect[]) {
  const update$ = from(
    effects.map((effect) => effect(gameSubject.asObservable()))
  ).pipe(mergeAll());
  return update$.subscribe((reducer) => {
    setGameState(reducer(getGameState()));
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

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    // better way? Probably not.
    window.location.reload();
  });
}
