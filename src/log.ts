import type { Direction, Side } from "./utils";
import {
  insert,
  remove,
  logPosForward,
  logPosBackward,
  deriveLogPos,
} from "./utils";
import fribidiFunctions from "./fribidiFunctions";

type LogState = {
  input: string;
  dir: Direction;
  logPos: number;
};

const insertChar = (char: string, state: LogState): LogState => {
  const input = insert(char, state.logPos, state.input);
  return {
    ...state,
    input,
    logPos: logPosForward(state.logPos, input, [...char].length),
  };
};

const backspace = (state: LogState): LogState => ({
  ...state,
  input: remove(state.logPos - 1, state.input),
  logPos: logPosBackward(state.logPos),
});

const deleteKey = (state: LogState): LogState => ({
  ...state,
  input: remove(state.logPos, state.input),
});

const arrowLeft = (state: LogState): LogState => ({
  ...state,
  logPos: logPosBackward(state.logPos, 1),
});

const arrowRight = (state: LogState): LogState => ({
  ...state,
  logPos: logPosForward(state.logPos, state.input, 1),
});

const home = (state: LogState): LogState => ({
  ...state,
  logPos: 0,
});

const end = (state: LogState): LogState => ({
  ...state,
  logPos: [...state.input].length,
});

const click = (
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

const clickOnLog = (
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

export default {
  arrowLeft,
  arrowRight,
  insertChar,
  backspace,
  deleteKey,
  home,
  end,
  click,
  debug: { clickOnLog },
};
