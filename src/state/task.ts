import { deviation, sampleWeighted, uniqueId } from "../util";

export type Id = `task-${string}`;

export interface T {
  id: Id;
  name: string;
  level: number;
  points: number;
}

function generateName(opts: { level: number }) {
  switch (opts.level) {
    case 0:
      return "Help out around the village";
    case 1:
      return "Calm village troublmaker";
    case 2:
      return "Dangerous animal outside the village";
    case 3:
      return "Scouting mission";
  }
  return "Unnamed task";
}

export function make(): T {
  const level = sampleWeighted([
    { value: 0, weight: 10 },
    { value: 1, weight: 5 },
    { value: 2, weight: 2 },
    { value: 3, weight: 1 },
  ]);
  return {
    id: `task-${uniqueId()}`,
    name: generateName({ level }),
    level,
    points: Math.round(deviation(25 * 1.25 ** level, 0.1)),
  };
}
