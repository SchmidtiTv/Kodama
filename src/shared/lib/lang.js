// Locale detection shared by App and AppShell (previously duplicated in both).
// detectSystemLang picks the best supported language from the browser/OS locale;
// getInitialLang prefers a previously saved choice, falling back to the system locale.
const SUPPORTED = ["de", "en"]; // extend when more locales are added

export function detectSystemLang() {
  const candidates = navigator.languages?.length
    ? navigator.languages
    : [navigator.language || "en"];
  for (const loc of candidates) {
    const base = loc.split("-")[0].toLowerCase();
    if (SUPPORTED.includes(base)) return base;
  }
  return "en";
}

export function getInitialLang() {
  return localStorage.getItem("kiyoshi-lang") || detectSystemLang();
}
