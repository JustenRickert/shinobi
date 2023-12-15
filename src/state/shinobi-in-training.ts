import { uniqueId } from "../util";

export type Id = `shinobi-in-training-${string}`;

export interface T {
  id: Id;
  name: string;
  level: number;
  createdAt: number;
}

export function make(): T {
  return {
    id: `shinobi-in-training-${uniqueId()}`,
    name: "Shinobi John",
    level: 0,
    createdAt: Date.now(),
  };
}

export function cost(shinobi: T) {
  return 5 * 1.25 ** shinobi.level;
}
