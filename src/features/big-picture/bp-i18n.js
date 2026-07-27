import { translate } from "@/shared/i18n/i18n.js";
import { getInitialLang } from "@/shared/lib/lang.js";

// Big Picture is mounted beside the application provider tree, so it reads the same persisted
// language key directly. Missing locale entries still fall back through the shared translator.
export function bpt(key, vars = {}) {
  return translate(getInitialLang(), key, vars);
}
