// Tiny external store for the active settings sub-section. The scroll-spy writes here and only
// the settings sidebar subscribes (useSyncExternalStore) — so scrolling never re-renders the
// whole App tree (which caused a brief lag when the section state lived in App).
const _settingsSection = { v: null, listeners: new Set() };
// After a sub-nav click we scroll smoothly to the target; suppress the scroll-spy briefly so it
// doesn't flicker to intermediate sections while the smooth scroll passes over them.
let _settingsSectionLockUntil = 0;

export function lockSettingsSection(ms = 600) {
  _settingsSectionLockUntil = Date.now() + ms;
}

// True while a sub-nav click's smooth scroll is still in progress (scroll-spy should stand down).
export function isSettingsSectionLocked() {
  return Date.now() < _settingsSectionLockUntil;
}

export function setSettingsSectionStore(v) {
  if (v === _settingsSection.v) return;
  _settingsSection.v = v;
  _settingsSection.listeners.forEach((l) => l());
}

export function subscribeSettingsSection(l) {
  _settingsSection.listeners.add(l);
  return () => _settingsSection.listeners.delete(l);
}

export function getSettingsSection() {
  return _settingsSection.v;
}
