import { useEffect, useState } from "preact/hooks";
import { sum } from "ramda";
import { Observable, distinctUntilChanged, map } from "rxjs";

import { GameState, Shinobi, getGameState, useGameStateStream } from ".";
import { IR } from "../ir";
import { memoizeOne } from "../util";

export function distinctPointsPerSecond() {
  return distinctUntilChanged<GameState>((s1, s2) => s1.shinobi === s2.shinobi);
}

export const getPointsPerSecond = memoizeOne(function (state: GameState) {
  return sum(IR.list(state.shinobi).map((s) => Shinobi.pointsPerSecond(s)));
});

export function getPointsPerSecondStream(state$: Observable<GameState>) {
  return state$.pipe(distinctPointsPerSecond(), map(getPointsPerSecond));
}

export function usePointsPerSecond() {
  const state$ = useGameStateStream();
  const [pps, setPps] = useState(() => getPointsPerSecond(getGameState()));
  useEffect(() => {
    const sub = getPointsPerSecondStream(state$).subscribe(setPps);
    return () => {
      sub.unsubscribe();
    };
  }, [state$]);
  return pps;
}
