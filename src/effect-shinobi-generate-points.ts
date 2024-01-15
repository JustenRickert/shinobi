import { lensProp, over } from "ramda";
import { interval, map, timeInterval, withLatestFrom } from "rxjs";
import { GameEffect } from "./state";
import { getPointsPerSecondStream } from "./state/util";

export const effectShinobiGeneratePoints: GameEffect = (state$) => {
  const PERIOD = 1e3 / 15;
  const TICK_RATE = 1e3 / PERIOD;

  const perTick$ = getPointsPerSecondStream(state$).pipe(
    map((pps) => pps / TICK_RATE)
  );

  let batched = 0;

  return interval(PERIOD).pipe(
    timeInterval(),
    withLatestFrom(perTick$),
    map(([{ interval }, perTick]) => {
      const r = interval / PERIOD;
      batched += r * perTick;
      if (batched > 0) {
        const gain = Math.floor(batched);
        batched %= 1;
        return over(lensProp("points"), (p) => p + gain);
      }
    })
  );
};
