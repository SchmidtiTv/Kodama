import test from "node:test";
import assert from "node:assert/strict";
import { Buffer } from "node:buffer";
import { readFile } from "node:fs/promises";
import { URL } from "node:url";

const source = await readFile(new URL("./shortcuts.js", import.meta.url), "utf8");
const shortcutModule = await import(
  `data:text/javascript;base64,${Buffer.from(source).toString("base64")}`
);
const { assignShortcut, matchesShortcut, serializeShortcut } = shortcutModule;

function keyEvent(code, modifiers = {}) {
  return {
    code,
    ctrlKey: false,
    shiftKey: false,
    altKey: false,
    metaKey: false,
    ...modifiers,
  };
}

test("serializes all supported modifiers in a stable order", () => {
  assert.equal(
    serializeShortcut(
      keyEvent("KeyK", {
        ctrlKey: true,
        shiftKey: true,
        altKey: true,
        metaKey: true,
      })
    ),
    "Ctrl+Shift+Alt+Meta+KeyK"
  );
});

test("requires an exact modifier match", () => {
  assert.equal(matchesShortcut("Space", keyEvent("Space")), true);
  assert.equal(matchesShortcut("Space", keyEvent("Space", { ctrlKey: true })), false);
  assert.equal(
    matchesShortcut("Ctrl+Shift+Equal", keyEvent("Equal", { ctrlKey: true, shiftKey: true })),
    true
  );
  assert.equal(matchesShortcut("Ctrl+Shift+Equal", keyEvent("Equal", { ctrlKey: true })), false);
  assert.equal(matchesShortcut("Meta+KeyK", keyEvent("KeyK", { metaKey: true })), true);
  assert.equal(matchesShortcut("Meta+KeyK", keyEvent("KeyK", { ctrlKey: true })), false);
});

test("swaps bindings when assigning a shortcut that is already in use", () => {
  assert.deepEqual(
    assignShortcut(
      {
        playPause: "Space",
        nextTrack: "ArrowRight",
      },
      "playPause",
      "ArrowRight"
    ),
    {
      playPause: "ArrowRight",
      nextTrack: "Space",
    }
  );
});

test("assigns previously unused shortcuts without changing other actions", () => {
  assert.deepEqual(
    assignShortcut(
      {
        playPause: "Space",
        nextTrack: "ArrowRight",
      },
      "playPause",
      "Ctrl+KeyP"
    ),
    {
      playPause: "Ctrl+KeyP",
      nextTrack: "ArrowRight",
    }
  );
});
