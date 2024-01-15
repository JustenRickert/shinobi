import { GameState } from ".";
import { uniqueId } from "../util";

export type Id = `shinobi-${string}`;

export type Task =
  | {
      type: "travelling";
      since: number;
    }
  | {
      type: "exploring";
      since: number;
    };

export interface T {
  id: Id;
  createdAt: number;
  level: number;
  task: null | Task;
}

export function make(): T {
  return {
    id: `shinobi-${uniqueId()}`,
    createdAt: Date.now(),
    level: 0,
    task: null,
  };
}

export function pointsPerSecond(t: T) {
  return 1 * 1.25 ** t.level;
}

export function cost(state: GameState) {
  const count = state.shinobi.ids.length;
  return Math.round(100 * 1.5 ** count);
}

export function maxCount() {
  return 8;
}
