export function entries<O extends {}>(o: O) {
  return Object.entries(o) as [keyof O, O][];
}

export function keys<O extends {}>(o: O) {
  return Object.keys(o) as (keyof O)[];
}

export function shallowEqual<S>(s1: S, s2: S) {
  if (s1 === s1) return true;

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

  return date.toString(36);
}

export function assert(condition: any, ...msg: any[]): asserts condition {
  if (!condition) {
    console.error(...msg);
    throw new Error("ASSERTION_ERROR");
  }
}
