import fribidiFunctions from "./fribidiFunctions";

export const fribidiResult = fribidiFunctions.friBidiResult;

export const LRE = "\u202A";
export const RLE = "\u202B";
export const LRO = "\u202D";
export const RLO = "\u202E";
export const PDF = "\u202C";
export const LRM = "\u200E";
export const RLM = "\u200F";
export const ALM = "\u061C";
export const LRI = "\u2066";
export const RLI = "\u2067";
export const FSI = "\u2068";
export const PDI = "\u2069";

export type Direction = "ltr" | "rtl";
export type Side = "left" | "right";
export type Mode = "log" | "vis";
const isLTR = (logPos: number, levels: Record<number, number>) =>
  !(levels[logPos] % 2);
const isRTL = (logPos: number, levels: Record<number, number>) =>
  !!(levels[logPos] % 2);

type LogState = {
  input: string;
  dir: Direction;
  logPos: number;
};

type VisState = {
  input: string;
  dir: Direction;
  visPos: number;
  lean: Side;
};

type VisState2 = {
  input: string;
  dir: Direction;
  visPos: [number, number];
  logPos: [number, number];
  lean: Side;
};

const removeChar = (logPos: number, input: string) => {
  if (logPos >= 0 && logPos < [...input].length) {
    return [...input.slice(0, logPos), ...input.slice(logPos + 1)].join("");
  } else {
    return input;
  }
};

const insertChar = (char: string, logPos: number, input: string) => {
  if (logPos >= 0 && logPos <= [...input].length) {
    return [...input.slice(0, logPos), char, ...input.slice(logPos)].join("");
  } else {
    return input;
  }
};

const getCharLevel = (
  char: string,
  logPos: number,
  input: string,
  dir: Direction
) => {
  const testInput = insertChar(char, logPos, input);
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

const logPosForward = (logPos: number, input: string, n = 1) => {
  return Math.min(logPos + n, input.length);
};

const logPosBackward = (logPos: number, n = 1) => {
  return Math.max(logPos - n, 0);
};

const visPosRight = (visPos: number, input: string, n = 1) => {
  const len = [...input].length;
  return Math.min(visPos + n, len);
};

const visPosLeft = (visPos: number, n = 1) => {
  return Math.max(visPos - n, 0);
};

const visInsertChar = (char: string, state: VisState): VisState => {
  const derivedLogPos = deriveLogPos(state.visPos, state.input, state.dir);
  const level = getCharLevel(char, derivedLogPos[0], state.input, state.dir);
  const input = insertChar(char, derivedLogPos[level % 2], state.input);
  const visPos = level % 2 ? state.visPos : visPosRight(state.visPos, input);
  return {
    ...state,
    input,
    visPos,
    lean: level % 2 ? "left" : "right",
  };
};

const logInsertChar = (char: string, state: LogState): LogState => {
  const input = insertChar(char, state.logPos, state.input);
  return {
    ...state,
    input,
    logPos: logPosForward(state.logPos, input, [...char].length),
  };
};

const visInsertChar2 = (char: string, state: VisState2): VisState2 => {
  if (state.visPos[0] !== state.visPos[1]) {
    const tempState = logInsertChar(char, {
      input: state.input,
      dir: state.dir,
      logPos: state.logPos[0],
    });
    return {
      ...state,
      input: tempState.input,
      visPos: deriveVisPos(tempState.logPos, tempState.input, tempState.dir),
      logPos: [tempState.logPos, tempState.logPos],
    };
  } else {
    const tempState = visInsertChar(char, {
      input: state.input,
      dir: state.dir,
      visPos: state.visPos[0],
      lean: state.lean,
    });
    const logPos = deriveLogPos(
      tempState.visPos,
      tempState.input,
      tempState.dir
    )[tempState.lean === "left" ? 0 : 1];
    return {
      ...state,
      input: tempState.input,
      visPos: [tempState.visPos, tempState.visPos],
      logPos: [logPos, logPos],
      lean: tempState.lean,
    };
  }
};

const logBackspace = (state: LogState): LogState => ({
  ...state,
  input: removeChar(state.logPos - 1, state.input),
  logPos: logPosBackward(state.logPos),
});

const logDelete = (state: LogState): LogState => ({
  ...state,
  input: removeChar(state.logPos, state.input),
});

const visBackspace = (state: VisState): VisState => {
  const derivedLogPos = deriveLogPos(state.visPos, state.input, state.dir);
  const { levels } = fribidiFunctions.friBidiResult(state.input, state.dir);
  if (isLTR(derivedLogPos[0], levels) && isRTL(derivedLogPos[1], levels)) {
    return state;
  }
  const charToRemove =
    state.lean === "left" ? derivedLogPos[1] - 1 : derivedLogPos[0] - 1;
  return {
    ...state,
    input: removeChar(charToRemove, state.input),
    visPos: isLTR(charToRemove, levels) ? state.visPos - 1 : state.visPos,
  };
};

const visDelete = (state: VisState): VisState => {
  const derivedLogPos = deriveLogPos(state.visPos, state.input, state.dir);
  const { levels } = fribidiFunctions.friBidiResult(state.input, state.dir);

  if (isRTL(derivedLogPos[0], levels) && isLTR(derivedLogPos[1], levels)) {
    return state;
  }
  const charToRemove =
    state.lean === "left" ? derivedLogPos[1] : derivedLogPos[0];
  return {
    ...state,
    input: removeChar(charToRemove, state.input),
    visPos: isRTL(charToRemove, levels) ? state.visPos - 1 : state.visPos,
  };
};

const visBackspace2 = (state: VisState2): VisState2 => {
  if (state.logPos[0] !== [...state.input].length) {
    if (state.visPos[0] !== state.visPos[1]) throw new Error("Invalid visPos");
    const tempState = visBackspace({
      input: state.input,
      dir: state.dir,
      visPos: state.visPos[0],
      lean: state.lean,
    });
    return {
      ...state,
      input: tempState.input,
      visPos: [tempState.visPos, tempState.visPos],
      logPos: deriveLogPos(tempState.visPos, tempState.input, tempState.dir),
    };
  } else {
    if (state.logPos[0] !== state.logPos[1]) throw new Error("Invalid logPos");
    const tempState = logBackspace({
      input: state.input,
      dir: state.dir,
      logPos: state.logPos[0],
    });
    return {
      ...state,
      input: tempState.input,
      visPos: deriveVisPos(tempState.logPos, tempState.input, tempState.dir),
      logPos: [tempState.logPos, tempState.logPos],
    };
  }
};

const visDelete2 = (state: VisState2): VisState2 => {
  const derivedLogPos = deriveLogPos(state.visPos[0], state.input, state.dir);
  const { levels } = fribidiFunctions.friBidiResult(state.input, state.dir);

  if (isRTL(derivedLogPos[0], levels) && isLTR(derivedLogPos[1], levels)) {
    return state;
  }
  const charToRemove =
    state.lean === "left" ? derivedLogPos[1] : derivedLogPos[0];
  const visPos = isRTL(charToRemove, levels)
    ? state.visPos[0] - 1
    : state.visPos[0];
  return {
    ...state,
    input: removeChar(charToRemove, state.input),
    visPos: [visPos, visPos],
  };
};

const controlType = {
  isolate: [
    [LRI, PDI],
    [RLI, PDI],
  ],
  embedding: [
    [LRE, PDF],
    [RLE, PDF],
  ],
  override: [
    [LRO, PDF],
    [RLO, PDF],
  ],
};

const visInsertCharSpecial = (
  char: string,
  type: string,
  state: VisState
): VisState => {
  const derivedLogPos = deriveLogPos(state.visPos, state.input, state.dir);
  const level = getCharLevel(char, derivedLogPos[0], state.input, state.dir);
  const [startChar, endChar] = controlType[type][level % 2];
  if (!(level % 2)) {
    // LTR
    return {
      ...state,
      input: insertChar(
        startChar + char + endChar,
        derivedLogPos[0],
        state.input
      ),
      visPos: visPosRight(state.visPos, state.input),
    };
  } else if (level % 2) {
    // RTL
    return {
      ...state,
      input: insertChar(
        startChar + char + endChar,
        derivedLogPos[1],
        state.input
      ),
      visPos: visPosLeft(state.visPos),
    };
  } else {
    throw new Error("Invalid level");
  }
};

const logArrowLeft = (state: LogState): LogState => ({
  ...state,
  logPos: logPosBackward(state.logPos, 1),
});

const logArrowRight = (state: LogState): LogState => {
  return {
    ...state,
    logPos: logPosForward(state.logPos, state.input, 1),
  };
};

const logClick = (
  clickedVisPos: number,
  side: Side,
  state: LogState
): LogState => {
  const { v2lMap, levels } = fribidiFunctions.friBidiResult(
    state.input,
    state.dir
  );
  const charDir = levels[v2lMap[clickedVisPos]] % 2;
  if (side === "left") {
    return {
      ...state,
      logPos: deriveLogPos(clickedVisPos, state.input, state.dir)[charDir],
    };
  } else if (side === "right") {
    return {
      ...state,
      logPos: deriveLogPos(clickedVisPos + 1, state.input, state.dir)[charDir],
    };
  } else {
    throw new Error("Invalid side");
  }
};

const visArrowLeft = (state: VisState): VisState => ({
  ...state,
  visPos: visPosLeft(state.visPos, 1),
  lean: "left",
});

const visArrowLeft2 = (state: VisState2): VisState2 => {
  const primaryVisPos = state.visPos[state.lean === "left" ? 0 : 1];
  const newVisPos = visPosLeft(primaryVisPos);
  return {
    ...state,
    visPos: [newVisPos, newVisPos],
    logPos: deriveLogPos(newVisPos, state.input, state.dir),
    lean: "left",
  };
};

const visArrowRight = (state: VisState): VisState => ({
  ...state,
  visPos: visPosRight(state.visPos, state.input),
  lean: "right",
});

const visArrowRight2 = (state: VisState2): VisState2 => {
  const primaryVisPos = state.visPos[state.lean === "left" ? 0 : 1];
  const newVisPos = visPosRight(primaryVisPos, state.input);
  return {
    ...state,
    visPos: [newVisPos, newVisPos],
    logPos: deriveLogPos(newVisPos, state.input, state.dir),
    lean: "right",
  };
};

const visClick = (
  clickedVisPos: number,
  side: Side,
  state: VisState
): VisState => {
  if (side === "left") {
    return { ...state, visPos: clickedVisPos, lean: side };
  } else if (side === "right") {
    return { ...state, visPos: clickedVisPos + 1, lean: side };
  } else {
    throw new Error("Invalid side");
  }
};

const visClick2 = (
  clickedVisPos: number,
  side: Side,
  state: VisState2
): VisState2 => {
  const newVisPos =
    side === "left"
      ? clickedVisPos
      : side === "right"
      ? clickedVisPos + 1
      : null;
  if (newVisPos === null) throw new Error("Invalid side");
  return {
    ...state,
    visPos: [newVisPos, newVisPos],
    logPos: deriveLogPos(newVisPos, state.input, state.dir),
    lean: side,
  };
};

const logClickOnLog = (
  clickedLogPos: number,
  side: Side,
  state: LogState
): LogState => {
  if (side === "left") {
    return { ...state, logPos: clickedLogPos };
  } else if (side === "right") {
    return { ...state, logPos: clickedLogPos + 1 };
  } else {
    throw new Error("Invalid side");
  }
};

const visClickOnLog = (
  clickedLogPos: number,
  side: Side,
  state: VisState
): VisState => {
  const { levels } = fribidiResult(state.input, state.dir);
  const charDir = levels[clickedLogPos] % 2;
  if (side === "left") {
    return {
      ...state,
      visPos: deriveVisPos(clickedLogPos, state.input, state.dir)[charDir],
      lean: "left",
    };
  } else if (side === "right") {
    return {
      ...state,
      visPos: deriveVisPos(clickedLogPos + 1, state.input, state.dir)[charDir],
      lean: "right",
    };
  } else {
    throw new Error("Invalid side");
  }
};

const visClickOnLog2 = (
  clickedLogPos: number,
  side: Side,
  state: VisState2
): VisState2 => {
  if (!["left", "right"].includes(side)) throw new Error("Invalid side");
  const { levels } = fribidiResult(state.input, state.dir);
  const charDir = levels[clickedLogPos] % 2;
  const newVisPos = deriveVisPos(
    side === "left" ? clickedLogPos : clickedLogPos + 1,
    state.input,
    state.dir
  )[charDir];
  return {
    ...state,
    visPos: [newVisPos, newVisPos],
    logPos: deriveLogPos(newVisPos, state.input, state.dir),
    lean: side,
  };
};

export const log = {
  arrowLeft: logArrowLeft,
  arrowRight: logArrowRight,
  insertChar: logInsertChar,
  backspace: logBackspace,
  delete: logDelete,
  click: logClick,
  debug: { clickOnLog: logClickOnLog },
};

export const vis = {
  arrowLeft: visArrowLeft,
  arrowRight: visArrowRight,
  insertChar: visInsertChar,
  backspace: visBackspace,
  delete: visDelete,
  click: visClick,
  debug: { clickOnLog: visClickOnLog, insertCharSpecial: visInsertCharSpecial },
};

export const vis2 = {
  arrowLeft: visArrowLeft2,
  arrowRight: visArrowRight2,
  insertChar: visInsertChar2,
  backspace: visBackspace2,
  delete: visDelete2,
  click: visClick2,
  debug: {
    clickOnLog: visClickOnLog2,
    insertCharSpecial: visInsertCharSpecial,
  },
};
