import { IR } from "../util";

describe("IR", () => {
  it("adds", () => {
    const ir: IR.T<string, { id: string; value: string }> = {
      ids: [],
      record: {},
    };
    const irWithKeyAdded = IR.add({ id: "key", value: "value" }, ir);
    expect(irWithKeyAdded).toMatchSnapshot();

    const irWithKeyRemoved = IR.remove("key", irWithKeyAdded);
    expect(irWithKeyRemoved).toMatchSnapshot();
  });
});
