/** Serialize a keydown event to a storable shortcut string, e.g. "Ctrl+Equal" or "Space". */
export function serializeShortcut(event) {
  const modifiers = [];
  if (event.ctrlKey) modifiers.push("Ctrl");
  if (event.shiftKey) modifiers.push("Shift");
  if (event.altKey) modifiers.push("Alt");
  return modifiers.length > 0 ? [...modifiers, event.code].join("+") : event.code;
}

/**
 * Match a stored shortcut string against a keydown event. Single-key shortcuts (without "+")
 * match by code only for backwards compatibility. Compound shortcuts match their code and the
 * explicitly listed Ctrl/Alt modifiers; Shift remains layout-tolerant for Ctrl+= / Ctrl++.
 */
export function matchesShortcut(stored, event) {
  if (!stored) return false;
  if (!stored.includes("+")) return event.code === stored;
  const parts = stored.split("+");
  const code = parts[parts.length - 1];
  const modifiers = new Set(parts.slice(0, -1));
  return (
    event.code === code &&
    event.ctrlKey === modifiers.has("Ctrl") &&
    event.altKey === modifiers.has("Alt")
  );
}

// Fallback code->display-label map for keyboard shortcuts, used when a live layout-aware
// label has not yet been captured for a key code. Moved out of App.jsx.
export const CODE_DISPLAY_FALLBACK = {
  Space: "Space",
  ArrowRight: "→",
  ArrowLeft: "←",
  ArrowUp: "↑",
  ArrowDown: "↓",
  Escape: "Esc",
  KeyA: "A",
  KeyB: "B",
  KeyC: "C",
  KeyD: "D",
  KeyE: "E",
  KeyF: "F",
  KeyG: "G",
  KeyH: "H",
  KeyI: "I",
  KeyJ: "J",
  KeyK: "K",
  KeyL: "L",
  KeyM: "M",
  KeyN: "N",
  KeyO: "O",
  KeyP: "P",
  KeyQ: "Q",
  KeyR: "R",
  KeyS: "S",
  KeyT: "T",
  KeyU: "U",
  KeyV: "V",
  KeyW: "W",
  KeyX: "X",
  KeyY: "Y",
  KeyZ: "Z",
  Digit0: "0",
  Digit1: "1",
  Digit2: "2",
  Digit3: "3",
  Digit4: "4",
  Digit5: "5",
  Digit6: "6",
  Digit7: "7",
  Digit8: "8",
  Digit9: "9",
  Equal: "=",
  Minus: "-",
  BracketLeft: "[",
  BracketRight: "]",
  Semicolon: ";",
  Quote: "'",
  Backquote: "`",
  Backslash: "\\",
  Comma: ",",
  Period: ".",
  Slash: "/",
  NumpadAdd: "Num+",
  NumpadSubtract: "Num-",
  NumpadMultiply: "Num*",
  NumpadDivide: "Num/",
  NumpadDecimal: "Num.",
  Numpad0: "Num0",
  Numpad1: "Num1",
  Numpad2: "Num2",
  Numpad3: "Num3",
  Numpad4: "Num4",
  Numpad5: "Num5",
  Numpad6: "Num6",
  Numpad7: "Num7",
  Numpad8: "Num8",
  Numpad9: "Num9",
  F1: "F1",
  F2: "F2",
  F3: "F3",
  F4: "F4",
  F5: "F5",
  F6: "F6",
  F7: "F7",
  F8: "F8",
  F9: "F9",
  F10: "F10",
  F11: "F11",
  F12: "F12",
  Backspace: "⌫",
  Tab: "Tab",
  Enter: "↵",
};
