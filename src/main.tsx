import { render } from "preact";

import "./index.css";

import {
  EMPTY,
  distinct,
  from,
  interval,
  map,
  mergeMap,
  withLatestFrom,
} from "rxjs";
import { App } from "./app.tsx";
import { GameEffect, GameProvider, runGameEffects } from "./state";

const gameEffects: GameEffect[] = [
  function generatePoints(_state$) {
    return interval(1e3).pipe(
      map(() => (state) => ({
        ...state,
        points: state.points + 1,
      }))
    );
  },
  function shinobiTaskAssignment(state$) {
    const shinobiId$ = state$.pipe(
      mergeMap((state) => from(state.shinobi.ids)),
      distinct()
    );

    return EMPTY;
  },
];

const effectsSub = runGameEffects(gameEffects);

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    effectsSub.unsubscribe();
  });
}

render(
  <GameProvider>
    <App />
  </GameProvider>,
  document.getElementById("app")!
);
