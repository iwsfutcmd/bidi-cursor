import { expect, test } from "vitest";
import { log, vis, type Direction, type Side } from "./index";

const testInputs = [
  "aאbבcגdדeהfוgזh",
  "אaבbגcדdהeוfזgח",
  "אבגדהוז",
  "ابجدهوز",
  "abcdefg",
  "1234567",
  "١٢٣٤٥٦٧",
  "♔♕♖♗♘♙",
  "       ",
];

const testMatrix = testInputs.flatMap((input) =>
  (["ltr", "rtl"] as Direction[]).flatMap((dir) =>
    (["left", "right"] as Side[]).map((lean) => ({ input, dir, lean }))
  )
);

test.for(testMatrix)("Vis arrowRight(%s)", (state) => {
  const len = [...state.input].length;
  Array.from({ length: len + 1 }).forEach((_, i) => {
    expect(vis.arrowRight({ ...state, visPos: i })).toEqual({
      input: state.input,
      dir: state.dir,
      visPos: i === len ? len : i + 1,
      lean: "right",
    });
  });
});

test.for(testMatrix)("Vis arrowLeft(%s)", (state) => {
  const len = [...state.input].length;
  Array.from({ length: len + 1 }).forEach((_, i) => {
    expect(vis.arrowLeft({ ...state, visPos: i })).toEqual({
      input: state.input,
      dir: state.dir,
      visPos: i === 0 ? 0 : i - 1,
      lean: "left",
    });
  });
});

// test("logPosForward", () => {
//   expect(add(1, 2)).toBe(3);
// });
