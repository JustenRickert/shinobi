import { IR, pipe } from "../util";
import { GameState, Shinobi, Task } from "./";

export function assignTaskToShinobi(
  task: Task.T,
  shinobiId: Shinobi.Id,
  state: GameState
) {
  return pipe<GameState>(
    (state) => ({
      ...state,
      shinobi: IR.update(
        shinobiId,
        (shinobi) => ({
          ...shinobi,
          behavior: Shinobi.behaviorAssignedTask(task),
        }),
        state.shinobi
      ),
    }),
    (state) => ({
      ...state,
      village: {
        ...state.village,
        tasks: IR.remove(task.id, state.village.tasks),
      },
    })
  )(state);
}
