export function entries<O extends {}>(o: O) {
  return Object.entries(o) as [keyof O, O][];
}

export function keys<O extends {}>(o: O) {
  return Object.keys(o) as (keyof O)[];
}

export function shallowEqual<S>(s1: S, s2: S) {
  if (s1 === s2) return true;

  if (
    typeof s1 !== "object" ||
    s1 === null ||
    typeof s2 !== "object" ||
    s2 === null
  )
    return false;

  const keys1 = keys(s1);
  const keys2 = keys(s1);

  if (keys1.length !== keys2.length) return false;

  for (let i = 0; i < keys1.length; i++) {
    if (
      !Object.hasOwnProperty.call(s2, keys1[i]) ||
      s1[keys1[i]] !== s2[keys1[i]]
    )
      return false;
  }

  return true;
}

uniqueId.previous = 0;
export function uniqueId() {
  let date = Date.now();

  if (date <= uniqueId.previous) {
    date = ++uniqueId.previous;
  } else {
    uniqueId.previous = date;
  }

  return Array.from(date.toString(36)).slice(0, -2).reverse().join("");
}

export function assert(condition: any, ...msg: any[]): asserts condition {
  if (!condition) {
    console.error(...msg);
    throw new Error("ASSERTION_ERROR");
  }
}

export function chance(p: number) {
  return Math.random() < p;
}

export function deviation(n: number, p: number) {
  const d = p * 2 * (Math.random() - 0.5);
  return n * (1 - d);
}

function updateIn3<S extends {}, V>(
  keys: string[],
  reducer: (v: V) => V,
  state: S
): S {
  // @ts-expect-error
  if (!keys.length) return reducer(state);
  const [k, ...rest] = keys;
  assert(state && k in state, "bad keys", { keys, reducer, state });
  return {
    ...state,
    // @ts-expect-error
    [k]: updateIn3(rest, reducer, state[k]),
  };
}

export function updateIn<S extends {}, V>(
  keys: string[],
  reducer: (v: V) => V
) {
  return (state: S): S => updateIn3(keys, reducer, state);
}

// function update3<R extends {}, S extends keyof R>(
//   key: S,
//   fn: (t: R[S]) => R[S],
//   record: R

// ) {
// }

// export function updateAt<R extends {}, S extends keyof R = keyof R>(
//   key: S,
//   fn: (t: R[S]) => R[S]
// ): (r: R) => R;
// export function updateAt<R extends {}, S extends keyof R = keyof R>(
//   key: S,
//   fn: (t: R[S]) => R[S],
//   record?: R
// ): R | ((r: R) => R) {
//   // @ts-expect-error
//   if (!record) return (record: R) => updateAt(key, fn, record);
//   return {
//     ...record,
//     [key]: fn(record[key]),
//   };
// }

// export function updateAt<K extends string, T, R extends {}>(
//   key: K,
//   t: T,
//   record: R
// ) {
//   return set(lensProp(key), t, record);
// }

// export function setAt<R extends {}, S extends keyof R = keyof R>(
//   key: S,
//   value: R[S]
// ): (r: R) => R;
// export function setAt<R extends {}, S extends keyof R = keyof R>(
//   key: S,
//   value: R[S],
//   record?: R
// ): R | ((r: R) => R) {
//   // @ts-expect-error
//   if (!record) return (record: R) => setAt(key, value, record);
//   return {
//     ...record,
//     [key]: value,
//   };
// }

// type DeepPartial<T> = T extends {}
//   ? {
//       [P in keyof T]?: DeepPartial<T[P]>;
//     }
//   : T;

// export function mergeRightDeep<S extends {}>(
//   state: S,
//   update: DeepPartial<S>
// ): S {
//   return entries(update).reduce((state, [key, value]) => {
//     if (typeof value === "object")
//       return {
//         ...state,
//         // @ts-expect-error
//         [key]: mergeRightDeep(state[key], update[key]),
//       };
//     return {
//       ...state,
//       [key]: value,
//     };
//   }, state);
// }

// export function mergeLeft<S extends {}>(update: Partial<S>) {
//   return (state: S): S => {

//   };
// }

export function pipe<S>(...fns: ((s: S) => S)[]) {
  return (s: S) => fns.reduceRight((s, fn) => fn(s), s);
}

export function thru<S>(s: S, ...fns: ((s: S) => S)[]) {
  return fns.reduce((s, fn) => fn(s), s);
}

export function sample<T>(ts: T[]) {
  assert(ts.length);
  return ts[Math.floor(Math.random() * ts.length)];
}

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
    t: T,
    ir: IR.T<Id, T>
  ): IR.T<Id, T> {
    assert(!ir.ids.includes(t.id), "Cannot `add`", { t, ir });
    return {
      ids: ir.ids.concat(t.id),
      record: {
        ...ir.record,
        [t.id]: t,
      },
    };
  }

  export function remove<Id extends string, T extends { id: Id }>(
    id: Id,
    ir: IR.T<Id, T>
  ): IR.T<Id, T> {
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
  ) {
    return make(list(ir).filter(predicate));
  }
}

export function sampleWeighted<T>(ts: { weight: number; value: T }[]) {
  let r = Math.random() * ts.reduce((sum, { weight }) => sum + weight, 0);
  const { value } = ts.find(({ weight }) => (r -= weight) < 0)!;
  return value;
}

export function when<T>(...crs: [condition: boolean, result: T][]) {
  for (const [condition, result] of crs) {
    if (condition) {
      return result;
    }
  }
  console.error(...crs);
  throw new Error("WHEN_ERROR: No condition met");
}
