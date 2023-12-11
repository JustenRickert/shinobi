import { uniqueId } from "../util";

export type Id = `task-${string}`;

export interface T {
  id: Id;
  name: string;
}

export function make(): T {
  return {
    id: `task-${uniqueId()}`,
    name: "D-rank task",
  };
}
