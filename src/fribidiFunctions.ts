import createFriBidiModule from "./fribidi.js";

const fribidi = await createFriBidiModule();

const log2vis = fribidi.cwrap("fribidi_log2vis", "number", [
  "number", // input
  "number", // len
  "number", // base dir
  "number", // output
  "number", // L_to_V map
  "number", // V_to_L map
  "number", // levels
]);

const dirMap = {
  ltr: 0x00000110,
  rtl: 0x00000111,
  auto: 0x00000040,
};

const revDirMap = {
  0x00000110: "ltr",
  0x00000111: "rtl",
  0x00000040: "auto",
};

const padArray = <T>(array: T[], first: T, last: T): Record<number, T> => ({
  [-1]: first,
  ...array,
  [array.length]: last,
});

const friBidiResult = (input: string, baseDir: "ltr" | "rtl" | "auto") => {
  const utf32 = new Uint32Array([...input].map((ch) => ch.codePointAt(0) ?? 0));
  const len = utf32.length;

  const inPtr = fribidi._malloc(len * 4);
  const outPtr = fribidi._malloc(len * 4);
  const dirPtr = fribidi._malloc(4);
  const l2vPtr = fribidi._malloc((len + 1) * 4);
  const v2lPtr = fribidi._malloc((len + 1) * 4);
  const levelPtr = fribidi._malloc(len);
  fribidi.HEAP32.set(utf32, inPtr >> 2);
  fribidi.setValue(dirPtr, dirMap[baseDir], "i32");
  log2vis(inPtr, len, dirPtr, outPtr, l2vPtr, v2lPtr, levelPtr);

  const dir = revDirMap[fribidi.getValue(dirPtr, "i32")];
  const logicalBuffer = fribidi.HEAP32.subarray(inPtr >> 2, (inPtr >> 2) + len);
  const logicalArray = padArray(
    Array.from(logicalBuffer).map((cp) => String.fromCodePoint(cp as number)),
    "␂",
    "␃"
  );
  const visualBuffer = fribidi.HEAP32.subarray(
    outPtr >> 2,
    (outPtr >> 2) + len
  );
  const visualArray = padArray(
    Array.from(visualBuffer).map((cp) => String.fromCodePoint(cp as number)),
    dir === "rtl" ? "␃" : "␂",
    dir === "rtl" ? "␂" : "␃"
  );
  const l2vMap = padArray(
    Array.from(new Int32Array(fribidi.HEAP8.buffer, l2vPtr, len)),
    dir === "rtl" ? len : -1,
    dir === "rtl" ? -1 : len
  );
  const v2lMap = padArray(
    Array.from(new Int32Array(fribidi.HEAP8.buffer, v2lPtr, len)),
    dir === "rtl" ? len : -1,
    dir === "rtl" ? -1 : len
  );
  const levels = padArray(
    fribidi.HEAP8.subarray(levelPtr, levelPtr + len),
    dir === "rtl" ? 1 : 0,
    dir === "rtl" ? 1 : 0
  );
  [inPtr, outPtr, dirPtr, l2vPtr, v2lPtr, levelPtr].forEach((ptr) =>
    fribidi._free(ptr)
  );

  return { logicalArray, visualArray, l2vMap, v2lMap, levels, dir };
};
export default { friBidiResult };
