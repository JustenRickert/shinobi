import { zip } from "ramda";

export { IR } from "./ir";

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

  return Array.from(date.toString(36)).reverse().join("");
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

export function pipeM<S>(...fns: ((s: S) => S)[]) {
  return (s: S) => fns.reduceRight((s, fn) => fn(s), s);
}

export function thru<S>(s: S, ...fns: ((s: S) => S)[]) {
  return fns.reduce((s, fn) => fn(s), s);
}

export function sample<T>(ts: T[] | readonly T[]) {
  assert(ts.length);
  return ts[Math.floor(Math.random() * ts.length)];
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

/**
 * Probably works. not tested exactly
 */
export function memoizeOne<Fn extends (...args: any[]) => any>(fn: Fn) {
  let last: null | { args: Parameters<Fn>; result: ReturnType<Fn> } = null;
  return (...args: Parameters<Fn>) => {
    if (!last || !zip(args, last.args).every(([l, r]) => l === r)) {
      const result = fn(...args);
      last = { args, result };
      return result as ReturnType<Fn>;
    }
    return last.result;
  };
}

export function mouseEvents(
  view: SVGElement,
  {
    onDown,
    onMove,
    onUp,
    onLeave,
    onOut,
  }: // onClick,
  {
    onDown: (e: MouseEvent) => void;
    onUp?: (e: MouseEvent) => void;
    onOut?: (e: MouseEvent) => void;
    onLeave?: (e: MouseEvent) => void;
    onMove: (e: MouseEvent) => void;
    // onClick?: (e: MouseEvent) => void;
  }
) {
  view.addEventListener("mousedown", onDown);
  if (onUp) view.addEventListener("mouseup", onUp);
  if (onOut) view.addEventListener("mouseout", onOut);
  if (onLeave) view.addEventListener("mouseleave", onLeave);
  view.addEventListener("mousemove", onMove);
  // if (onClick) view.addEventListener("click", onClick);
  return () => {
    view.removeEventListener("mousedown", onDown);
    if (onUp) view.removeEventListener("mouseup", onUp);
    if (onLeave) view.removeEventListener("mouseleave", onLeave);
    view.removeEventListener("mousemove", onMove);
    // if (onClick) view.removeEventListener("click", onClick);
  };
}
