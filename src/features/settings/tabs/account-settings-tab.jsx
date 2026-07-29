import { AccountSettingsTab } from "../account-settings-tab.jsx";
export function AccountTabContent({ hideUserHandle, onToggleHideUserHandle }) {
  return (
    <AccountSettingsTab
      hideUserHandle={hideUserHandle}
      onToggleHideUserHandle={onToggleHideUserHandle}
    />
  );
}
