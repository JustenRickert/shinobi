import { render } from "preact";

import "./index.css";

import {
  EMPTY,
  distinct,
  from,
  interval,
  map,
  merge,
  mergeMap,
  tap,
  throttleTime,
  timer,
  withLatestFrom,
} from "rxjs";
import { App } from "./app";
import { ToastProvider } from "./components/toast";
import {
  VILLAGE_SHINOBI_IN_TRAINING_GENERATION_TIMEOUT_BASE,
  VILLAGE_TASK_EXPIRATION_TIMEOUT_BASE,
  VILLAGE_TASK_GENERATION_TIMEOUT_BASE,
} from "./constant";
import { makeShinobiBehoviorUpdateStream } from "./state/effect-genin-behavior";
import {
  GameEffect,
  GameProvider,
  GameState,
  Genin,
  ShinobiInTraining,
  Task,
  runGameEffects,
} from "./state/index";
import { IR, pipe, updateIn } from "./util";

const gameEffects: GameEffect[] = [
  function generatePoints(_state$) {
    return interval(1e3).pipe(
      map(() => (state) => ({
        ...state,
        points: state.points + 1,
      }))
    );
  },

  function shinobiBehavior(state$) {
    return state$.pipe(
      mergeMap((state) => from(state.genin.ids)),
      distinct(),
      mergeMap((id) => makeShinobiBehoviorUpdateStream(id, state$))
    );
  },

  function taskGeneration(state$) {
    const addTask = (task: Task.T) =>
      pipe<GameState>(
        updateIn(["village", "tasks"], (tasks: GameState["village"]["tasks"]) =>
          IR.add(task, tasks)
        )
      );

    /**
     * TODO might be a better way to handle stale state than this method that
     * I'm not thinking of...
     */
    const taskStillExists = (id: Task.Id, state: GameState) =>
      Boolean(state.village.tasks.record[id]);

    const expireTask = (id: Task.Id) =>
      pipe<GameState>((state) => ({
        ...state,
        village: {
          ...state.village,
          tasks: IR.remove(id, state.village.tasks),
        },
      }));

    const generation$ = interval(VILLAGE_TASK_GENERATION_TIMEOUT_BASE).pipe(
      map(() => addTask(Task.make()))
    );

    const expiration$ = state$.pipe(
      mergeMap((state) => from(state.village.tasks.ids)),
      distinct(),
      mergeMap((id) =>
        timer(VILLAGE_TASK_EXPIRATION_TIMEOUT_BASE).pipe(
          withLatestFrom(state$),
          map(([, state]) => {
            if (taskStillExists(id, state)) return expireTask(id);
          })
        )
      )
    );

    return merge(generation$, expiration$);
  },

  function shinobiInTrainingGeneration(state$) {
    const addShinobiInTraining = (shinobi: ShinobiInTraining.T) =>
      pipe<GameState>((state) => ({
        ...state,
        village: {
          ...state.village,
          shinobiInTraining: IR.add(shinobi, state.shinobiInTraining),
        },
      }));

    const shinobiInTrainingStillExists = (id: Genin.Id, state: GameState) =>
      Boolean(IR.list(state.shinobiInTraining).find((s) => s.id === id));

    const expireShinobiInTraining = (id: Genin.Id) =>
      pipe<GameState>((state) => ({
        ...state,
        village: {
          ...state.village,
          shinobiInTraining: IR.list(state.shinobiInTraining).filter(
            (s) => s.id !== id
          ),
        },
      }));

    const generation$ = interval(
      VILLAGE_SHINOBI_IN_TRAINING_GENERATION_TIMEOUT_BASE
    ).pipe(map(() => addShinobiInTraining(ShinobiInTraining.make())));

    const expiration$ = state$.pipe(
      mergeMap((state) =>
        from(IR.list(state.shinobiInTraining).map((s) => s.id))
      ),
      distinct(),
      mergeMap((id) =>
        timer(VILLAGE_TASK_EXPIRATION_TIMEOUT_BASE).pipe(
          withLatestFrom(state$),
          map(([, state]) => {
            if (shinobiInTrainingStillExists(id, state)) {
              console.log("EXPIRING");
              return expireShinobiInTraining(id);
            }
          })
        )
      )
    );

    return merge(generation$, expiration$);
  },

  function logState(state$) {
    return state$.pipe(
      throttleTime(15e3),
      tap((state) => console.log("STATE", state)),
      mergeMap(() => EMPTY)
    );
  },

  function saveState(state$) {
    const SAVE_STATE_TIMEOUT = 30e3;
    return timer(SAVE_STATE_TIMEOUT).pipe(
      withLatestFrom(state$),
      map((state) => {
        const s = JSON.stringify(state);
        window.localStorage.setItem("__state__", s);
      })
    );
  },
];

const effectsSub = runGameEffects(gameEffects);

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    effectsSub.unsubscribe();
  });
}

render(
  <GameProvider>
    <ToastProvider>
      <App />
    </ToastProvider>
  </GameProvider>,
  document.getElementById("app")!
);
