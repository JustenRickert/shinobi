import { Task } from ".";
import { uniqueId } from "../util";

export type Id = `shinobi-${string}`;

export interface T {
  id: Id;
  name: string;
  level: number;
  assignedTask: null | Task.T;
}

export function make(): T {
  return {
    id: `shinobi-${uniqueId()}`,
    name: "Shinobi John",
    level: 0,
    assignedTask: null,
  };
}

export function cost(shinobi: T) {
  return 5 * 1.25 ** shinobi.level;
}
