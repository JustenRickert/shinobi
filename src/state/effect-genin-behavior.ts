import { lensProp, over, set } from "ramda";
import {
  EMPTY,
  Observable,
  distinctUntilChanged,
  distinctUntilKeyChanged,
  map,
  of,
  switchMap,
  timer,
  withLatestFrom,
} from "rxjs";
import {
  SHINOBI_ASSIGNED_TASK_TIMEOUT_BASE,
  SHINOBI_IDLE_TASK_TIMEOUT_BASE,
  SHINOBI_INJURED_TIMEOUT_BASE,
} from "../constant.ts";
import { IR, assert, chance, pipeM, sample, thru } from "../util.ts";
import { assignTaskToShinobi } from "./actions.ts";
import { addMessage } from "./genin.ts";
import { GameState, Genin, Task } from "./index.tsx";

export function makeShinobiBehoviorUpdateStream(
  id: Genin.Id,
  state$: Observable<GameState>
) {
  const taskSuccessFn = (task: Task.T) =>
    pipeM<GameState>(
      over(lensProp("points"), (p) => p + task.points),
      over(
        lensProp("genin"),
        IR.update(
          id,
          pipeM(
            addMessage({ type: "task-success", when: Date.now(), task }),
            set(lensProp("behavior"), Genin.behaviorIdle())
          )
        )
      )
    );

  const taskFailureFn = (task: Task.T) =>
    pipeM<GameState>(
      over(
        lensProp("genin"),
        IR.update(
          id,
          pipeM(
            addMessage({ type: "task-failed", when: Date.now(), task }),
            set(lensProp("behavior"), Genin.behaviorIdle())
          )
        )
      )
    );

  const assignRandomTask = (state: GameState) => {
    // TODO: Sometimes two shinobi are asked to run this at the same time,
    // wherein only one of them will succeed. Here we return early for that
    // case, which is a bit awkward. It may be better to have a separate effect
    // that spies both ready shinobi and available tasks, and dispatches
    if (!state.village.tasks.ids.length) return;
    const task = sample(IR.list(state.village.tasks));
    return assignTaskToShinobi(task, id, state);
  };

  const turnIdle = pipeM<GameState>((state: GameState) => ({
    ...state,
    genin: thru(
      state.genin,
      IR.update(id, (genin) => ({
        ...genin,
        behavior: Genin.behaviorIdle(),
      }))
    ),
  }));

  const turnAvailable = pipeM<GameState>((state: GameState) => ({
    ...state,
    genin: thru(
      state.genin,
      IR.update(id, (shinobi) => ({
        ...shinobi,
        behavior: Genin.behaviorAvailable(),
      }))
    ),
  }));

  const genin$ = state$.pipe(
    map((state) => state.genin.record[id]),
    distinctUntilChanged()
  );

  const shinobiBehaviorUpdate$ = genin$.pipe(
    map((s) => s),
    distinctUntilKeyChanged("behavior", (b1, b2) => b1.type === b2.type),
    switchMap((shinobi) => {
      switch (shinobi.behavior.type) {
        case "available": {
          return state$.pipe(
            map((state) => Boolean(IR.list(state.village.tasks).length)),
            distinctUntilChanged(),
            switchMap((going) => (going ? of(assignRandomTask) : EMPTY))
          );
        }
        case "injured": {
          return timer(SHINOBI_INJURED_TIMEOUT_BASE).pipe(map(() => turnIdle));
        }
        case "idle": {
          return timer(SHINOBI_IDLE_TASK_TIMEOUT_BASE).pipe(
            map(() => turnAvailable)
          );
        }
        case "assigned-task":
          return timer(SHINOBI_ASSIGNED_TASK_TIMEOUT_BASE).pipe(
            withLatestFrom(genin$),
            map(([, genin]) => {
              assert(genin.behavior.type === "assigned-task");
              const p = Genin.taskSuccessChance(genin.behavior.task, genin);
              const success = chance(p);
              return success
                ? taskSuccessFn(genin.behavior.task)
                : taskFailureFn(genin.behavior.task);
            })
          );
      }
    })
  );

  return shinobiBehaviorUpdate$;
}
