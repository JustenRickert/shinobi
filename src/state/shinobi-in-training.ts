import { sample, uniqueId } from "../util";

export type Id = `shinobi-in-training-${string}`;

const AFFINITY_TYPES = ["fire", "wind", "lightning", "earth", "water"] as const;
const JUTSU_TYPES = ["ninjustu", "genjutsu", "taijutsu"] as const;

type JutsuType = (typeof JUTSU_TYPES)[number];
type AffinityType = (typeof AFFINITY_TYPES)[number];

export interface T {
  id: Id;
  name: string;
  level: number;
  createdAt: number;
  jutsuTypes: JutsuType[];
  affinityType: AffinityType;
}

const namesMeaningWater = [
  "Aalto",
  "Adrian",
  "Aenon",
  "Bach",
  "Barbeau",
  "Bardo",
  "Beck",
  "Calder",
  "Carlow",
  "Cary",
];

const namesMeaningFire = [
  "Aarush",
  "Agni",
  "Aithne",
  "Blaze",
  "Brand",
  "Brigid",
  "Calida",
  "Ember",
  "Mehri",
  "Nina",
  "Nomalanga",
];

function name({ affinityType }: { affinityType: AffinityType }) {
  switch (affinityType) {
    case "fire":
      return sample(namesMeaningFire);
    case "water":
      return sample(namesMeaningWater);
    default:
      return "John";
  }
}

export function make(options?: { createdAt: number }): T {
  const affinityType = sample(AFFINITY_TYPES);
  return {
    id: `shinobi-in-training-${uniqueId()}`,
    name: name({ affinityType }),
    level: 0,
    createdAt: options?.createdAt ?? Date.now(),
    jutsuTypes: [sample(JUTSU_TYPES)],
    affinityType,
  };
}

export function cost(shinobi: T) {
  return 5 * 1.25 ** shinobi.level;
}
