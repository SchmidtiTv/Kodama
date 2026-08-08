import assert from "node:assert/strict";
import test from "node:test";

import { shuffleTracks } from "./shuffle-tracks.js";

test("shuffleTracks returns a reordered copy without changing the source", () => {
  const tracks = [{ id: "a" }, { id: "b" }, { id: "c" }];
  const random = Math.random;
  Math.random = () => 0;

  try {
    const shuffled = shuffleTracks(tracks);
    assert.deepEqual(shuffled.map((track) => track.id), ["b", "c", "a"]);
    assert.deepEqual(tracks.map((track) => track.id), ["a", "b", "c"]);
  } finally {
    Math.random = random;
  }
});
