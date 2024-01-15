import { IR, pipeM } from "../util";
import { GameState, Genin, Task } from "./";

export function assignTaskToShinobi(
  task: Task.T,
  shinobiId: Genin.Id,
  state: GameState
) {
  return pipeM<GameState>(
    (state) => ({
      ...state,
      genin: IR.update(
        shinobiId,
        (shinobi) => ({
          ...shinobi,
          behavior: Genin.behaviorAssignedTask(task),
        }),
        state.genin
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
