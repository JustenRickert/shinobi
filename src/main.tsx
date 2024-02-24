import { interval, map, timeInterval, withLatestFrom } from "rxjs";
import { render } from "preact";

import "./index.css";

import { App } from "./app";
import { gameState$, serializeGameState, setGameState, step } from "./game";
import { SAVE_STATE_KEY } from "./constant";

export function makeStepGameSubscription() {
  return interval(1e3)
    .pipe(
      timeInterval(),
      map(({ interval }) => {
        if (interval > 10e3) {
          // TODO handle sleeping somehow?
        }
        setGameState(step);
      })
    )
    .subscribe();
}

export function makeSaveStateSubscription() {
  return interval(5e3)
    .pipe(withLatestFrom(gameState$))
    .subscribe(([, state]) => {
      localStorage.setItem(
        SAVE_STATE_KEY,
        JSON.stringify(serializeGameState(state))
      );
    });
}

const subscriptions = [makeStepGameSubscription(), makeSaveStateSubscription()];

if (import.meta.hot) {
  import.meta.hot.accept(() => {
    subscriptions.forEach((s) => s.unsubscribe());
  });
}

render(<App />, document.getElementById("app")!);
