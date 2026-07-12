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
