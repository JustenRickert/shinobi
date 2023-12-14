import { render } from "preact";

import "./index.css";

import {
  EMPTY,
  distinct,
  distinctUntilChanged,
  from,
  interval,
  map,
  mergeMap,
  switchMap,
  tap,
  throttleTime,
} from "rxjs";
import { App } from "./app";
import {
  GameEffect,
  GameProvider,
  GameState,
  Task,
  runGameEffects,
} from "./state/index";
import { makeShinobiBehoviorUpdateStream } from "./state/effect-shinobi-behavior";
import { IR, pipe, updateIn } from "./util";
import { VILLAGE_TASK_GENERATION_TIMEOUT_BASE } from "./constant";

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
      mergeMap((state) => from(state.shinobi.ids)),
      distinct(),
      mergeMap((id) => makeShinobiBehoviorUpdateStream(id, state$))
    );
  },

  function taskGeneration(state$) {
    const going$ = state$.pipe(
      map((state) => state.village.tasks.ids.length < 20),
      distinctUntilChanged()
    );

    const addTask = (task: Task.T) =>
      pipe<GameState>(
        updateIn(["village", "tasks"], (tasks: GameState["village"]["tasks"]) =>
          IR.add(task, tasks)
        )
      );

    return going$.pipe(
      switchMap((going) =>
        going
          ? interval(VILLAGE_TASK_GENERATION_TIMEOUT_BASE).pipe(
              map(() => addTask(Task.make()))
            )
          : EMPTY
      )
    );
  },

  function logState(state$) {
    return state$.pipe(
      throttleTime(15e3),
      tap((state) => console.log("STATE", state)),
      mergeMap(() => EMPTY)
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
    <App />
  </GameProvider>,
  document.getElementById("app")!
);
