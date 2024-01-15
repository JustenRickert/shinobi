import { entries } from "../util";

const PNG_RECORD = entries(import.meta.glob("./*.png", { eager: true })).reduce(
  (rec, [filename, mod]) => {
    const [, key] = /\.\/([\w\d-]+)\.png$/.exec(filename)!;
    rec[key] = mod.default as string;
    return rec;
  },
  {} as Record<string, string>
);

console.log(PNG_RECORD);

export function png(n: string) {
  return PNG_RECORD[n];
}
