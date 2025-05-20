import type { Direction, Side } from "./utils";
import {
  insert,
  remove,
  deriveLogPos,
  deriveVisPos,
  getCharLevel,
  visPosRight,
  visPosLeft,
  isLTR,
  isRTL,
  controlType,
} from "./utils";
import fribidiFunctions from "./fribidiFunctions";

type VisState = {
  input: string;
  dir: Direction;
  visPos: number;
  lean: Side;
};

const insertChar = (char: string, state: VisState): VisState => {
  const derivedLogPos = deriveLogPos(state.visPos, state.input, state.dir);
  const level = getCharLevel(char, derivedLogPos[0], state.input, state.dir);
  const input = insert(char, derivedLogPos[level % 2], state.input);
  const visPos = level % 2 ? state.visPos : visPosRight(state.visPos, input);
  return {
    ...state,
    input,
    visPos,
    lean: level % 2 ? "left" : "right",
  };
};

const backspace = (state: VisState): VisState => {
  const derivedLogPos = deriveLogPos(state.visPos, state.input, state.dir);
  const { levels } = fribidiFunctions.friBidiResult(state.input, state.dir);
  if (isLTR(derivedLogPos[0], levels) && isRTL(derivedLogPos[1], levels)) {
    return state;
  }
  const logPosToRemove =
    state.lean === "left" ? derivedLogPos[1] - 1 : derivedLogPos[0] - 1;
  return logPosToRemove >= 0
    ? {
        ...state,
        input: remove(logPosToRemove, state.input),
        visPos: isLTR(logPosToRemove, levels) ? state.visPos - 1 : state.visPos,
      }
    : state;
};

const deleteKey = (state: VisState): VisState => {
  const derivedLogPos = deriveLogPos(state.visPos, state.input, state.dir);
  const { levels } = fribidiFunctions.friBidiResult(state.input, state.dir);
  if (isRTL(derivedLogPos[0], levels) && isLTR(derivedLogPos[1], levels)) {
    return state;
  }
  const logPosToRemove =
    state.lean === "left" ? derivedLogPos[1] : derivedLogPos[0];
  return logPosToRemove < [...state.input].length
    ? {
        ...state,
        input: remove(logPosToRemove, state.input),
        visPos: isRTL(logPosToRemove, levels) ? state.visPos - 1 : state.visPos,
      }
    : state;
};

const insertCharSpecial = (
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
      input: insert(startChar + char + endChar, derivedLogPos[0], state.input),
      visPos: visPosRight(state.visPos, state.input),
    };
  } else if (level % 2) {
    // RTL
    return {
      ...state,
      input: insert(startChar + char + endChar, derivedLogPos[1], state.input),
      visPos: visPosLeft(state.visPos),
    };
  } else {
    throw new Error("Invalid level");
  }
};

const arrowLeft = (state: VisState): VisState => ({
  ...state,
  visPos: visPosLeft(state.visPos, 1),
  lean: "left",
});

const arrowRight = (state: VisState): VisState => ({
  ...state,
  visPos: visPosRight(state.visPos, state.input),
  lean: "right",
});

const home = (state: VisState): VisState => {
  const { dir } = fribidiFunctions.friBidiResult(state.input, state.dir);
  return {
    ...state,
    visPos: dir === "ltr" ? 0 : [...state.input].length,
  };
};

const end = (state: VisState): VisState => {
  const { dir } = fribidiFunctions.friBidiResult(state.input, state.dir);
  return {
    ...state,
    visPos: dir === "ltr" ? [...state.input].length : 0,
  };
};

const click = (
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

const clickOnLog = (
  clickedLogPos: number,
  side: Side,
  state: VisState
): VisState => {
  const { levels } = fribidiFunctions.friBidiResult(state.input, state.dir);
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

export default {
  arrowLeft,
  arrowRight,
  insertChar,
  backspace,
  deleteKey,
  click,
  home,
  end,
  debug: { clickOnLog, insertCharSpecial },
};
