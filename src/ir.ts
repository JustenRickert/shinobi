import { reduce } from "ramda";
import { DeepPartial, assert, deepMerge, keys } from "./util";

interface IROptions {
  debugName?: string;
}

interface SerializedIR<
  Id extends string = string,
  T extends { id: Id } = { id: Id }
> {
  readonly ids: Id[];
  readonly record: Record<Id, T>;
  readonly options?: IROptions;
}

export class IR<Id extends string = string, T extends { id: Id } = { id: Id }>
  implements SerializedIR
{
  readonly ids: Id[];
  readonly record: Record<Id, T>;
  readonly options?: IROptions = {};
  constructor(
    record: SerializedIR | T[] | IR<Id, T> | Record<Id, T> = {} as Record<
      Id,
      T
    >,
    options: IROptions = {}
  ) {
    if (options?.debugName) this.options = options;
    if (record instanceof Array) {
      this.ids = [];
      this.record = {} as Record<Id, T>;
      for (const t of record) {
        this.ids.push(t.id);
        this.record[t.id] = t;
      }
    } else if (record instanceof IR) {
      this.options = record.options;
      this.ids = record.ids;
      this.record = record.record;
    } else if ("ids" in record && "record" in record) {
      this.options = record.options;
      this.ids = record.ids as Id[];
      this.record = record.record as Record<Id, T>;
    } else {
      this.ids = keys(record);
      this.record = record;
    }
  }

  get length() {
    return this.ids.length;
  }

  public add(t: T | T[]) {
    const assertUnique = (id: Id) =>
      assert(
        !(id in this.record),
        'IR cannot contain a duplicate `id` ("%s")',
        id
      );

    if (Array.isArray(t)) {
      return new IR<Id, T>({
        ids: this.ids.concat(t.map((t) => t.id)),
        record: t.reduce(
          (record, t) => {
            assertUnique(t.id);
            record[t.id] = t;
            return record;
          },
          { ...this.record }
        ),
        options: this.options,
      });
    }

    assertUnique(t.id);

    return new IR<Id, T>({
      ids: this.ids.concat(t.id),
      record: {
        ...this.record,
        [t.id]: t,
      },
      options: this.options,
    });
  }

  public remove(id: Id | Id[]) {
    const assertExists = (id: Id) =>
      assert(
        this.record[id],
        "IR needs to contain a record (%s) in order to remove it.",
        id
      );

    if (Array.isArray(id)) {
      return new IR<Id, T>({
        ids: this.ids.filter((iid) => !id.includes(iid)),
        record: id.reduce(
          (record, id) => {
            delete record[id];
            return record;
          },
          { ...this.record }
        ),
        options: this.options,
      });
    }
    assertExists(id);
    const newRecord = { ...this.record };
    delete newRecord[id];
    return new IR<Id, T>({
      ids: this.ids.filter((iid) => iid !== id),
      record: newRecord,
      options: this.options,
    });
  }

  public update(id: Id, fn: (t: T) => DeepPartial<T>) {
    assert(this.record[id], 'IR needs to contain `id` ("%s") to update', id);
    const t = deepMerge(this.record[id], fn(this.record[id]));
    return new IR<Id, T>({
      ids: this.ids,
      record: {
        ...this.record,
        [t.id]: t,
      },
      options: this.options,
    });
  }

  public updateEach(idsFns: [Id, (t: T) => T][]) {
    const record = { ...this.record };
    for (const [id, fn] of idsFns) {
      assert(this.record[id], "IR does not contain `id` %s", id);
      record[id] = fn(this.record[id]);
    }
    return new IR<Id, T>({
      ids: this.ids,
      record,
      options: this.options,
    });
  }

  public has(id: Id) {
    return Boolean(this.record[id]);
  }

  public get(id: Id) {
    const t = this.record[id];
    assert(t, 'IR does not contain `id` "%s"', id);
    return t;
  }

  public set(id: Id, t: DeepPartial<T>) {
    assert(this.record[id], "IR should already contain `id` %s", id);
    return new IR<Id, T>({
      ids: this.ids,
      record: {
        ...this.record,
        [id]: deepMerge(this.record[id], t),
      },
      options: this.options,
    });
  }

  public filter(pred: (t: T) => boolean) {
    return new IR<Id, T>({
      options: this.options,
      ...this.list().reduce(
        (acc, t) => {
          if (pred(t)) {
            acc.ids.push(t.id);
            acc.record[t.id] = t;
          }
          return acc;
        },
        { ids: [], record: {} } as SerializedIR
      ),
    });
  }

  public list() {
    return this.ids.map((id) => this.record[id]);
  }

  // public updateAllWhere(pred: (t: T) => boolean, fn: (t: T) => T) {
  //   for (const t of this.list().filter(pred)) {
  //     this.record[t.id] = fn(t);
  //   }
  //   return new IR<Id, T>(this);
  // }

  // TODO reduce memo?
  public reduce<R>(reduceFn: (accumulator: R, value: T) => R, value: R) {
    for (const id of this.ids) value = reduceFn(value, this.record[id]);
    return value;
  }

  static isSerializedIR(ir: any): ir is SerializedIR {
    const fields: (keyof InstanceType<typeof IR>)[] = [
      "ids",
      "record",
      "options",
    ];
    return fields.every((field) => field in ir);
  }
}
