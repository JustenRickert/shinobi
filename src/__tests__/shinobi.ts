// TODO fix so we can have unit tests...
import { Shinobi, Task } from "../state/module";

jest.mock("../util", () => ({
  ...jest.requireActual("../util"),
  deviation: (n: number, _p: number) => n,
}));

function cartesian<T>(a: T[], b: T[]): [T, T][];
function cartesian<T>(a: T[], b: T[], c: T[]): [T, T, T][];
function cartesian<T>(...a: T[][]) {
  // @ts-expect-error
  return a.reduce((a, b) => a.flatMap((d) => b.map((e) => [d, e].flat())));
}

describe("shinobi", () => {
  it("task experience scales", () => {
    cartesian([0, 1, 2], [0, 1, 2])
      .map(([shinobiLevel, taskLevel]) => ({
        shinobi: Shinobi.make({ level: shinobiLevel }),
        task: Task.make({ level: taskLevel }),
      }))
      .forEach(({ shinobi, task }) => {
        const xp = Shinobi.taskExperienceGain(task, shinobi);
        expect(
          `shinobi=${shinobi.level}, task=${task.level}, xp=${xp}`
        ).toMatchSnapshot();
      });
  });
});
