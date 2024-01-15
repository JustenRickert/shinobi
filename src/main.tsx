import { render } from "preact";
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

import "./index.css";

import { App } from "./app";
import { ToastProvider } from "./components/toast";
import {
  SAVE_STATE_KEY,
  VILLAGE_TASK_EXPIRATION_TIMEOUT_BASE,
  VILLAGE_TASK_GENERATION_TIMEOUT_BASE,
} from "./constant";
import { makeShinobiBehoviorUpdateStream } from "./state/effect-genin-behavior";
import { effectShinobiInTrainingGenerationAndGraduation } from "./state/effect-shinobi-in-training";
import {
  GameEffect,
  GameProvider,
  GameState,
  Task,
  runGameEffects,
} from "./state/index";
import { IR, pipeM, updateIn } from "./util";
import { effectShinobiGeneratePoints } from "./effect-shinobi-generate-points";

const gameEffects: GameEffect[] = [
  effectShinobiGeneratePoints,

  // effectShinobiInTrainingGenerationAndGraduation,
  // function generatePoints(_state$) {
  //   return interval(1e3).pipe(
  //     map(() => (state) => ({
  //       ...state,
  //       points: state.points + 1,
  //     }))
  //   );
  // },
  // function shinobiBehavior(state$) {
  //   return state$.pipe(
  //     mergeMap((state) => from(state.genin.ids)),
  //     distinct(),
  //     mergeMap((id) => makeShinobiBehoviorUpdateStream(id, state$))
  //   );
  // },
  // function taskGeneration(state$) {
  //   const addTask = (task: Task.T) =>
  //     pipeM<GameState>(
  //       updateIn(["village", "tasks"], (tasks: GameState["village"]["tasks"]) =>
  //         IR.add(task, tasks)
  //       )
  //     );
  //   /**
  //    * TODO might be a better way to handle stale state than this method that
  //    * I'm not thinking of...
  //    */
  //   const taskStillExists = (id: Task.Id, state: GameState) =>
  //     Boolean(state.village.tasks.record[id]);
  //   const expireTask = (id: Task.Id) =>
  //     pipeM<GameState>((state) => ({
  //       ...state,
  //       village: {
  //         ...state.village,
  //         tasks: IR.remove(id, state.village.tasks),
  //       },
  //     }));
  //   const generation$ = interval(VILLAGE_TASK_GENERATION_TIMEOUT_BASE).pipe(
  //     map(() => addTask(Task.make()))
  //   );
  //   const expiration$ = state$.pipe(
  //     mergeMap((state) => from(state.village.tasks.ids)),
  //     distinct(),
  //     mergeMap((id) =>
  //       timer(VILLAGE_TASK_EXPIRATION_TIMEOUT_BASE).pipe(
  //         withLatestFrom(state$),
  //         map(([, state]) => {
  //           if (taskStillExists(id, state)) return expireTask(id);
  //         })
  //       )
  //     )
  //   );
  //   return merge(generation$, expiration$);
  // },
  // function logState(state$) {
  //   return state$.pipe(
  //     throttleTime(15e3),
  //     tap((state) => console.log("STATE", state)),
  //     mergeMap(() => EMPTY)
  //   );
  // },
  // function saveState(state$) {
  //   const SAVE_STATE_TIMEOUT = 30e3;
  //   return timer(SAVE_STATE_TIMEOUT).pipe(
  //     withLatestFrom(state$),
  //     map((state) => {
  //       const s = JSON.stringify(state);
  //       window.localStorage.setItem(SAVE_STATE_KEY, s);
  //     })
  //   );
  // },
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
