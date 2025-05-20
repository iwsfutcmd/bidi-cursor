import fribidiFunctions from "./fribidiFunctions";

export const BidiControls = {
  LRE: "\u202A",
  RLE: "\u202B",
  LRO: "\u202D",
  RLO: "\u202E",
  PDF: "\u202C",
  LRM: "\u200E",
  RLM: "\u200F",
  ALM: "\u061C",
  LRI: "\u2066",
  RLI: "\u2067",
  FSI: "\u2068",
  PDI: "\u2069",
};

export const controlType = {
  isolate: [
    [BidiControls.LRI, BidiControls.PDI],
    [BidiControls.RLI, BidiControls.PDI],
  ],
  embedding: [
    [BidiControls.LRE, BidiControls.PDF],
    [BidiControls.RLE, BidiControls.PDF],
  ],
  override: [
    [BidiControls.LRO, BidiControls.PDF],
    [BidiControls.RLO, BidiControls.PDF],
  ],
};

export type Direction = "ltr" | "rtl";
export type Side = "left" | "right";
export type Mode = "log" | "vis";

export const isLTR = (logPos: number, levels: Record<number, number>) =>
  !(levels[logPos] % 2);
export const isRTL = (logPos: number, levels: Record<number, number>) =>
  !!(levels[logPos] % 2);

export const remove = (logPos: number, input: string) => {
  if (logPos >= 0 && logPos < [...input].length) {
    return [...input.slice(0, logPos), ...input.slice(logPos + 1)].join("");
  } else {
    return input;
  }
};

export const insert = (char: string, logPos: number, input: string) => {
  if (logPos >= 0 && logPos <= [...input].length) {
    return [...input.slice(0, logPos), char, ...input.slice(logPos)].join("");
  } else {
    return input;
  }
};

export const getCharLevel = (
  char: string,
  logPos: number,
  input: string,
  dir: Direction
) => {
  const testInput = insert(char, logPos, input);
  const { levels } = fribidiFunctions.friBidiResult(testInput, dir);
  return levels[logPos];
};

export const deriveVisPos = (
  logPos: number,
  input: string,
  dir: Direction
): [number, number] => {
  const { l2vMap, levels } = fribidiFunctions.friBidiResult(input, dir);
  const dirCurr = levels[logPos] % 2 ? "rtl" : "ltr";
  const dirPrev = levels[logPos - 1] % 2 ? "rtl" : "ltr";
  if (dirCurr === "rtl") {
    if (dirPrev === "rtl") {
      return [l2vMap[logPos] + 1, l2vMap[logPos] + 1];
    } else if (dirPrev === "ltr") {
      return [l2vMap[logPos - 1] + 1, l2vMap[logPos] + 1];
    } else {
      throw new Error("Invalid direction");
    }
  } else if (dirCurr === "ltr") {
    if (dirPrev === "ltr") {
      return [l2vMap[logPos], l2vMap[logPos]];
    } else if (dirPrev === "rtl") {
      return [l2vMap[logPos], l2vMap[logPos - 1]];
    } else {
      throw new Error("Invalid direction");
    }
  } else {
    throw new Error("Invalid direction");
  }
};

export const deriveLogPos = (
  visPos: number,
  input: string,
  dir: Direction
): [number, number] => {
  const { v2lMap, levels } = fribidiFunctions.friBidiResult(input, dir);
  const dirCurr = levels[v2lMap[visPos]] % 2 ? "rtl" : "ltr";
  const dirLeft = levels[v2lMap[visPos - 1]] % 2 ? "rtl" : "ltr";
  if (dirCurr === "rtl") {
    if (dirLeft === "rtl") {
      return [v2lMap[visPos] + 1, v2lMap[visPos] + 1];
    } else if (dirLeft === "ltr") {
      return [v2lMap[visPos - 1] + 1, v2lMap[visPos] + 1];
    } else {
      throw new Error("Invalid direction");
    }
  } else if (dirCurr === "ltr") {
    if (dirLeft === "ltr") {
      return [v2lMap[visPos], v2lMap[visPos]];
    } else if (dirLeft === "rtl") {
      return [v2lMap[visPos], v2lMap[visPos - 1]];
    } else {
      throw new Error("Invalid direction");
    }
  } else {
    throw new Error("Invalid direction");
  }
};

export const logPosForward = (logPos: number, input: string, n = 1) => {
  return Math.min(logPos + n, input.length);
};

export const logPosBackward = (logPos: number, n = 1) => {
  return Math.max(logPos - n, 0);
};

export const visPosRight = (visPos: number, input: string, n = 1) => {
  const len = [...input].length;
  return Math.min(visPos + n, len);
};

export const visPosLeft = (visPos: number, n = 1) => {
  return Math.max(visPos - n, 0);
};
