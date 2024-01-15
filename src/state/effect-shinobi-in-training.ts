import { clamp, range } from "ramda";
import { Observable, interval, map, merge, timeInterval } from "rxjs";

import { GameEffectAction, GameState, ShinobiInTraining } from ".";
import {
  VILLAGE_SHINOBI_IN_TRAINING_GENERATION_TIMEOUT_BASE,
  VILLAGE_SHINOBI_IN_TRAINING_GRADUATION_TIMEOUT_BASE,
} from "../constant";
import { IR } from "../ir";
import { pipeM } from "../util";

let lastTime = Date.now();

function debugLog(msg: any) {
  console.log("since last: %s", Date.now() - lastTime, {
    graduationCount: msg.graduatingShinobi.ids.length,
    graduatingShinobi: msg.graduatingShinobi,
  });
  lastTime = Date.now();
}

function graduate(
  { timestamp }: { timestamp: number },
  state: GameState
): GameState {
  const graduatingShinobi = IR.filter(
    (shinobi) =>
      timestamp - shinobi.createdAt >
      VILLAGE_SHINOBI_IN_TRAINING_GRADUATION_TIMEOUT_BASE,
    state.shinobiInTraining
  );
  debugLog({
    now: timestamp,
    graduatingShinobi,
  });
  return {
    ...state,
    population: state.population + graduatingShinobi.ids.length,
    lastGraduationAt: timestamp,
    shinobiInTraining: IR.remove(
      graduatingShinobi.ids,
      state.shinobiInTraining
    ),
  };
}

function addShinobiInTraining(shinobis: ShinobiInTraining.T[]) {
  return pipeM<GameState>((state) => ({
    ...state,
    shinobiInTraining: IR.add(shinobis, state.shinobiInTraining),
  }));
}

export function effectShinobiInTrainingGenerationAndGraduation(
  _state$: Observable<GameState>
): GameEffectAction {
  const gradTime = VILLAGE_SHINOBI_IN_TRAINING_GRADUATION_TIMEOUT_BASE;
  const genTime = VILLAGE_SHINOBI_IN_TRAINING_GENERATION_TIMEOUT_BASE;

  const generation$ = interval(
    VILLAGE_SHINOBI_IN_TRAINING_GENERATION_TIMEOUT_BASE
  ).pipe(
    // TODO need to account for the amount of population gained
    timeInterval(),
    map(({ interval }) => {
      const count = Math.round(
        clamp(1, gradTime / genTime, interval / genTime)
      );
      console.log("Adding %s shinobi. %ss passed.", count, interval / 1e3, {});
      const now = Date.now();
      return pipeM(
        (state) => {
          const sinceLastGraduation = now - state.lastGraduationAt;
          console.log("since last graduation: %s", sinceLastGraduation);
          if (sinceLastGraduation > gradTime) {
            return graduate({ timestamp: now }, state);
          }
          return state;
        },
        addShinobiInTraining(
          range(0, count).map((i) =>
            ShinobiInTraining.make({
              createdAt: now - genTime * i,
            })
          )
        )
      );
    })
  );

  return merge(generation$);
}
