import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const source = await readFile(new URL("./sustained-line.js", import.meta.url), "utf8");
const sustainedLineModule = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const { sustainedLineScale } = sustainedLineModule;

test("does not scale a line shorter than the sustained-vocal threshold", () => {
  assert.equal(sustainedLineScale({ time: 10, endTime: 13.99 }, 12), 1);
});

test("smoothly grows a sustained line from its actual timing window", () => {
  const line = { time: 10, endTime: 15 };

  assert.equal(sustainedLineScale(line, 10), 1);
  assert.ok(sustainedLineScale(line, 12.5) > 1);
  assert.equal(sustainedLineScale(line, 15), 1.12);
});

test("falls back to word timing when a line end time is unavailable", () => {
  const line = { time: 10, words: [{ end: 14.5 }] };

  assert.ok(sustainedLineScale(line, 12) > 1);
});
