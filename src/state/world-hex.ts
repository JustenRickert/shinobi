import { Hex } from "../grid";

type What = "village" | "forest";

export interface T extends Hex.T {
  what: What;
  explored: boolean;
}

export function make({ hex, what }: { hex: Hex.T; what: What }): T {
  return {
    ...hex,
    what,
    explored: false,
  };
}

export function color(t: T) {
  switch (t.what) {
    case "village":
      return "gray";
    case "forest":
      if (!t.explored) return "url(#unexplored-forest)";
      return "green";
    default:
      return "black";
  }
}
