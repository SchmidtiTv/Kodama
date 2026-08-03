import assert from "node:assert/strict";
import test from "node:test";

import { collectTrackVersions, isLikelyVideo } from "./track-deduplication.js";

test("collectTrackVersions prefers an audio track over a video duplicate", () => {
  const tracks = collectTrackVersions([
    { videoId: "video", title: "Dai Dai", artists: "Shakira, Burna Boy", hasVideoThumbnail: true },
    { videoId: "audio", title: "Dai Dai", artists: "Shakira, Burna Boy", album: "Dai Dai" },
  ]);

  assert.deepEqual(
    tracks.map((track) => track.videoId),
    ["audio"]
  );
});

test("collectTrackVersions keeps distinct versions", () => {
  const tracks = collectTrackVersions([
    { videoId: "original", title: "Dai Dai", artists: "Shakira, Burna Boy" },
    { videoId: "remix", title: "Dai Dai (Remix)", artists: "Shakira, Burna Boy" },
  ]);

  assert.deepEqual(
    tracks.map((track) => track.videoId),
    ["original", "remix"]
  );
});

test("isLikelyVideo detects an explicit video title in cached playlist data", () => {
  assert.equal(
    isLikelyVideo({ title: "Eye Of The Tiger (Official HD Video)", album: "Survivor" }),
    true
  );
});

test("isLikelyVideo logs album-less cached video candidates", () => {
  assert.equal(isLikelyVideo({ title: "Take On Me", album: "" }), true);
});
