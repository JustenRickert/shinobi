import { lensProp, over } from "ramda";

import { Shinobi, useGameState, useSetGameState } from "./state";
import { IR } from "./ir";
import { pipeM } from "./util";

export function TrainShinobi() {
  const { shinobiIds, cost, disabled, maxCount } = useGameState((state) => {
    const shinobiIds = state.shinobi.ids;
    const maxCount = Shinobi.maxCount();
    const disabled =
      maxCount <= shinobiIds.length || Shinobi.cost(state) > state.points;
    return {
      shinobiIds,
      cost: Shinobi.cost(state),
      disabled,
      maxCount,
    };
  });
  const setGameState = useSetGameState();

  const trainNewShinobi = () => {
    setGameState(
      pipeM(
        over(lensProp("points"), (p) => p - cost),
        over(lensProp("shinobi"), IR.add(Shinobi.make()))
      )
    );
  };

  if (shinobiIds.length >= maxCount) return null;

  return (
    <div>
      {cost} ryō
      <button disabled={disabled} onClick={trainNewShinobi}>
        Train Shinobi
      </button>
    </div>
  );
}
