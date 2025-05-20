import type { Direction, Mode, Side } from "./utils";
import {
  deriveVisPos,
  deriveLogPos,
  visPosLeft,
  visPosRight,
  isRTL,
  isLTR,
  remove,
  getCharLevel,
} from "./utils";
import fribidiFunctions from "./fribidiFunctions";

import log from "./log";
import vis from "./vis";

type VisState2 = {
  input: string;
  dir: Direction;
  visPos: [number, number];
  logPos: [number, number];
  lean: Side;
  mode: Mode;
};

const insertChar = (char: string, state: VisState2): VisState2 => {
  if (state.mode === "log") {
    const tempState = log.insertChar(char, {
      input: state.input,
      dir: state.dir,
      logPos: state.logPos[0],
    });
    return {
      ...state,
      input: tempState.input,
      visPos: deriveVisPos(tempState.logPos, tempState.input, tempState.dir),
      logPos: [tempState.logPos, tempState.logPos],
      lean:
        getCharLevel(char, tempState.logPos, tempState.input, tempState.dir) % 2
          ? "left"
          : "right",
    };
  } else {
    const tempState = vis.insertChar(char, {
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
    const newCharLevel = getCharLevel(
      char,
      logPos,
      tempState.input,
      tempState.dir
    );
    const mode = logPos === [...tempState.input].length ? "log" : "vis";
    return {
      ...state,
      input: tempState.input,
      visPos: [tempState.visPos, tempState.visPos],
      logPos: [logPos, logPos],
      lean: tempState.lean,
      mode,
    };
  }
};

const backspace = (state: VisState2): VisState2 => {
  if (state.mode === "vis") {
    if (state.visPos[0] !== state.visPos[1]) throw new Error("Invalid visPos");
    const tempState = vis.backspace({
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
    const tempState = log.backspace({
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

const deleteKey = (state: VisState2): VisState2 => {
  const derivedLogPos = deriveLogPos(state.visPos[0], state.input, state.dir);
  const { levels } = fribidiFunctions.friBidiResult(state.input, state.dir);

  if (isRTL(derivedLogPos[0], levels) && isLTR(derivedLogPos[1], levels)) {
    return state;
  }
  const logPosToRemove =
    state.lean === "left" ? derivedLogPos[1] : derivedLogPos[0];
  const visPos = isRTL(logPosToRemove, levels)
    ? state.visPos[0] - 1
    : state.visPos[0];
  return {
    ...state,
    input: remove(logPosToRemove, state.input),
    visPos: [visPos, visPos],
  };
};

const arrowLeft = (state: VisState2): VisState2 => {
  const primaryVisPos = state.visPos[state.lean === "right" ? 0 : 1];
  const newVisPos = visPosLeft(primaryVisPos);
  return {
    ...state,
    visPos: [newVisPos, newVisPos],
    logPos: deriveLogPos(newVisPos, state.input, state.dir),
    lean: "left",
    mode: "vis",
  };
};

const arrowRight = (state: VisState2): VisState2 => {
  const primaryVisPos = state.visPos[state.lean === "right" ? 0 : 1];
  const newVisPos = visPosRight(primaryVisPos, state.input);
  return {
    ...state,
    visPos: [newVisPos, newVisPos],
    logPos: deriveLogPos(newVisPos, state.input, state.dir),
    lean: "right",
    mode: "vis",
  };
};

const home = (state: VisState2): VisState2 => {
  const tempState = vis.home({
    input: state.input,
    dir: state.dir,
    visPos: state.visPos[0],
    lean: state.lean,
  });
  return {
    ...state,
    visPos: [tempState.visPos, tempState.visPos],
    logPos: deriveLogPos(tempState.visPos, tempState.input, tempState.dir),
    lean: tempState.lean,
    mode: "vis",
  };
};

const end = (state: VisState2): VisState2 => {
  const tempState = vis.end({
    input: state.input,
    dir: state.dir,
    visPos: state.visPos[0],
    lean: state.lean,
  });
  return {
    ...state,
    visPos: [tempState.visPos, tempState.visPos],
    logPos: deriveLogPos(tempState.visPos, tempState.input, tempState.dir),
    lean: tempState.lean,
    mode: "vis",
  };
};

const click = (
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
    mode: "vis",
  };
};

const clickOnLog = (
  clickedLogPos: number,
  side: Side,
  state: VisState2
): VisState2 => {
  if (!["left", "right"].includes(side)) throw new Error("Invalid side");
  const { levels } = fribidiFunctions.friBidiResult(state.input, state.dir);
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
