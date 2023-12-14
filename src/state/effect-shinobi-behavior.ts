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
import { IR, assert, chance, pipe, sample, thru, updateIn } from "../util.ts";
import { GameState, Shinobi, Task } from "./";
import { assignTaskToShinobi } from "./actions.ts";
import {
  SHINOBI_ASSIGNED_TASK_TIMEOUT_BASE,
  SHINOBI_IDLE_TASK_TIMEOUT_BASE,
  SHINOBI_INJURED_TIMEOUT_BASE,
} from "../constant";
import { addMessage } from "./shinobi.ts";

export function makeShinobiBehoviorUpdateStream(
  id: Shinobi.Id,
  state$: Observable<GameState>
) {
  const taskSuccessFn = (task: Task.T) => (state: GameState) => ({
    ...state,
    points: state.points + task.points,
    shinobi: thru(
      state.shinobi,
      IR.update(
        id,
        pipe(
          addMessage({ type: "task-success", when: Date.now(), task }),
          (shinobi) => ({
            ...shinobi,
            behavior: {
              type: "idle",
            } as Shinobi.BehaviorIdle,
          })
        )
      )
    ),
  });

  const taskFailureFn = (task: Task.T) => (state: GameState) => ({
    ...state,
    shinobi: thru(
      state.shinobi,
      IR.update(
        id,
        pipe(
          addMessage({ type: "task-failed", when: Date.now(), task }),
          (shinobi) => ({
            ...shinobi,
            behavior: Shinobi.behaviorInjured(),
          })
        )
      )
    ),
  });

  const assignRandomTask = (shinobiId: Shinobi.Id) => (state: GameState) => {
    const task = sample(IR.list(state.village.tasks));
    return assignTaskToShinobi(task, shinobiId, state);
  };

  const turnIdle = (shinobiId: Shinobi.Id) =>
    pipe<GameState>((state: GameState) => ({
      ...state,
      shinobi: thru(
        state.shinobi,
        IR.update(shinobiId, (shinobi) => ({
          ...shinobi,
          behavior: Shinobi.behaviorIdle(),
        }))
      ),
    }));

  const shinobi$ = state$.pipe(
    map((state) => state.shinobi.record[id]),
    distinctUntilChanged()
  );

  return shinobi$.pipe(
    map((s) => s),
    distinctUntilKeyChanged("behavior", (b1, b2) => b1.type === b2.type),
    switchMap((shinobi) => {
      switch (shinobi.behavior.type) {
        case "injured": {
          return timer(SHINOBI_INJURED_TIMEOUT_BASE).pipe(
            map(() => turnIdle(shinobi.id))
          );
        }
        case "idle": {
          return timer(SHINOBI_IDLE_TASK_TIMEOUT_BASE).pipe(
            switchMap(() =>
              state$.pipe(
                map((state) => Boolean(IR.list(state.village.tasks).length)),
                distinctUntilChanged(),
                switchMap((going) =>
                  going ? of(assignRandomTask(shinobi.id)) : EMPTY
                )
              )
            )
          );
        }
        case "assigned-task":
          return timer(SHINOBI_ASSIGNED_TASK_TIMEOUT_BASE).pipe(
            withLatestFrom(shinobi$),
            map(([, shinobi]) => {
              assert(shinobi.behavior.type === "assigned-task");
              const p = Shinobi.taskSuccessChance(
                shinobi.behavior.task,
                shinobi
              );
              const success = chance(p);
              return success
                ? taskSuccessFn(shinobi.behavior.task)
                : taskFailureFn(shinobi.behavior.task);
            })
          );
      }
    })
  );
}
