import { assert } from "./util";

export namespace IR {
  export type T<Id extends string, T extends { id: Id }> = {
    ids: Id[];
    record: Record<Id, T>;
  };

  export function make<Id extends string, T extends { id: Id }>(
    ts: T[] = []
  ): IR.T<Id, T> {
    return {
      ids: ts.map((t) => t.id),
      record: ts.reduce((ir, t) => ({ ...ir, [t.id]: t }), {} as Record<Id, T>),
    };
  }

  export function add<Id extends string, T extends { id: Id }>(
    t: T | T[],
    ir: IR.T<Id, T>
  ): IR.T<Id, T>;
  export function add<Id extends string, T extends { id: Id }>(
    t: T | T[]
  ): (ir: IR.T<Id, T>) => IR.T<Id, T>;
  export function add<Id extends string, T extends { id: Id }>(
    t: T | T[],
    ir?: IR.T<Id, T>
  ): IR.T<Id, T> | ((ir: IR.T<Id, T>) => IR.T<Id, T>) {
    if (!ir) return (ir) => add(t, ir);
    if (Array.isArray(t)) {
      assert(
        t.every((t) => !ir.ids.includes(t.id)),
        "Cannot `add`. Some already exists in `ir`",
        arguments
      );
      return {
        ids: ir.ids.concat(t.map((t) => t.id)),
        record: t.reduce(
          (record, t) => ({
            ...record,
            [t.id]: t,
          }),
          ir.record
        ),
      };
    }
    assert(!(t.id in ir.record), `"t" already exists in "ir"`, {
      t,
      ir,
    });
    return {
      ids: ir.ids.concat(t.id),
      record: {
        ...ir.record,
        [t.id]: t,
      },
    };
  }

  export function remove<Id extends string, T extends { id: Id }>(
    id: Id | Id[]
  ): (ir: IR.T<Id, T>) => IR.T<Id, T>;
  export function remove<Id extends string, T extends { id: Id }>(
    id: Id | Id[],
    ir: IR.T<Id, T>
  ): IR.T<Id, T>;
  export function remove<Id extends string, T extends { id: Id }>(
    id: Id | Id[],
    ir?: IR.T<Id, T>
  ): IR.T<Id, T> | ((ir: IR.T<Id, T>) => IR.T<Id, T>) {
    if (!ir) return (ir) => remove(id, ir);
    if (Array.isArray(id)) {
      assert(
        id.every((id) => ir.ids.includes(id)),
        "Cannot `remove` %s",
        id,
        arguments
      );
      const record = {
        ...ir.record,
      };
      for (const idi of id) delete record[idi];
      return {
        ids: ir.ids.filter((iri) => !id.includes(iri)),
        record,
      };
    }
    assert(ir.ids.includes(id), "Cannot `remove`", { id, ir });
    const record = {
      ...ir.record,
    };
    delete record[id];
    return {
      ids: ir.ids.filter((iri) => iri !== id),
      record,
    };
  }

  function update2<Id extends string, T extends { id: Id }>(
    id: Id,
    fn: (t: T) => T
  ) {
    return (ir: IR.T<Id, T>): IR.T<Id, T> => ({
      ids: ir.ids,
      record: {
        ...ir.record,
        [id]: fn(ir.record[id]),
      },
    });
  }

  export function update<Id extends string, T extends { id: Id }>(
    id: Id,
    fn: (t: T) => T
  ): (ir: IR.T<Id, T>) => IR.T<Id, T>;
  export function update<Id extends string, T extends { id: Id }>(
    id: Id,
    fn: (t: T) => T,
    ir: IR.T<Id, T>
  ): IR.T<Id, T>;
  export function update<Id extends string, T extends { id: Id }>(
    id: Id,
    fn: (t: T) => T,
    ir?: IR.T<Id, T>
  ) {
    if (ir) return update2(id, fn)(ir);
    return update2(id, fn);
  }

  export function list<Id extends string, T extends { id: Id }>(
    ir: IR.T<Id, T>
  ) {
    return ir.ids.map((id) => ir.record[id]);
  }

  export function filter<Id extends string, T extends { id: Id }>(
    predicate: (t: T, i?: number, ts?: T[]) => boolean,
    ir: IR.T<Id, T>
  ): IR.T<Id, T> {
    return make(list(ir).filter(predicate));
  }
}
