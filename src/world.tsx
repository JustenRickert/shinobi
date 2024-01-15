import { useRef } from "preact/hooks";
import { lensPath, set } from "ramda";

import { SvgView } from "./grid/svg-view";
import { HexSvg } from "./grid/hex-svg";
import { Hex } from "./grid";
import { WorldHex, useGameState, useSetGameState } from "./state";
import { IR } from "./ir";

export function World() {
  const ref = useRef<SVGSVGElement>(null);
  const setGameState = useSetGameState();
  const { world } = useGameState((state) => ({
    world: state.world,
  }));

  const setSelectedHex = (hex: Hex.T) =>
    setGameState(set(lensPath(["ui", "selectedHex"]), hex.id));

  return (
    <SvgView svgRef={ref} disablePanning>
      {IR.list(world).map((worldHex) => (
        <HexSvg
          onClick={setSelectedHex}
          hex={worldHex}
          color={WorldHex.color(worldHex)}
        />
      ))}
    </SvgView>
  );
}
