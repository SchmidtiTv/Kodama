import { Button, CardRoot } from "@heroui/react";
import { Key, Lock, LockOpen } from "@/shared/icons/icons.jsx";
import { SettingRow, SettingsSectionLabel, Toggle } from "@/shared/ui/settings-controls.jsx";
export function SecuritySettingsTab({
  pinEmergencyConfirm,
  pinEnabled,
  pinLength,
  pinType,
  setPinDigits,
  setPinEmergencyConfirm,
  setPinEnabled,
  setPinLength,
  setPinPasswordInput,
  setPinSetup,
  setPinSetupDigits,
  setPinSetupError,
  setPinSetupPasswordInput,
  setPinType,
  setPinVerified,
  t,
}) {
  return (
    <>
      <SettingsSectionLabel>{t("pinProtection")}</SettingsSectionLabel>

      {/* Type selector — only when PIN is not yet enabled */}
      {!pinEnabled && (
        <SettingRow label={t("pinTypeLabel")} description={t("pinTypeDesc")} icon={<Key />}>
          <div className="flex gap-1.5">
            {["pin", "password"].map((type) => (
              <Button
                key={type}
                variant={pinType === type ? "primary" : "ghost"}
                size="sm"
                onPress={() => {
                  setPinType(type);
                  localStorage.setItem("kiyoshi-pin-type", type);
                }}
              >
                {t(type === "pin" ? "pinTypePin" : "pinTypePassword")}
              </Button>
            ))}
          </div>
        </SettingRow>
      )}

      {/* PIN length selector — only when type is "pin" and not yet enabled */}
      {!pinEnabled && pinType === "pin" && (
        <SettingRow label={t("pinLengthLabel")} description={t("pinLengthDesc")} icon={<Key />}>
          <div className="flex gap-1.5">
            {[4, 6].map((len) => (
              <Button
                key={len}
                variant={pinLength === len ? "primary" : "ghost"}
                size="sm"
                onPress={() => {
                  setPinLength(len);
                  localStorage.setItem("kiyoshi-pin-length", String(len));
                }}
              >
                {len}-{t("pinDigits")}
              </Button>
            ))}
          </div>
        </SettingRow>
      )}

      <SettingRow
        label={t("pinProtectionLabel")}
        description={
          pinEnabled
            ? `${t("pinProtectionDesc")} · ${t(pinType === "pin" ? "pinTypePin" : "pinTypePassword")}${pinType === "pin" ? ` (${pinLength}-${t("pinDigits")})` : ""}`
            : t("pinProtectionDesc")
        }
        icon={pinEnabled ? <Lock /> : <LockOpen />}
      >
        <Toggle
          value={pinEnabled}
          onChange={() => {
            if (!pinEnabled) {
              setPinSetup({
                mode: "enable",
                step: "new",
                first: null,
              });
              setPinSetupDigits([]);
              setPinSetupPasswordInput("");
              setPinSetupError("");
            } else {
              setPinSetup({
                mode: "disable",
                step: "current",
                first: null,
              });
              setPinSetupDigits([]);
              setPinSetupPasswordInput("");
              setPinSetupError("");
            }
          }}
        />
      </SettingRow>

      {pinEnabled && (
        <SettingRow label={t("pinChange")} description={t("pinChangeDesc")} icon={<Lock />}>
          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setPinSetup({
                mode: "change",
                step: "current",
                first: null,
              });
              setPinSetupDigits([]);
              setPinSetupPasswordInput("");
              setPinSetupError("");
            }}
          >
            {t("pinChange")}
          </Button>
        </SettingRow>
      )}

      <SettingsSectionLabel
        style={{
          marginTop: 24,
        }}
      >
        {t("pinEmergency")}
      </SettingsSectionLabel>
      <CardRoot
        variant="secondary"
        className="px-4 py-3.5 gap-0! text-t12 text-muted leading-[1.7]"
        style={{
          background: "var(--status-danger-soft)",
        }}
      >
        <div
          style={{
            marginBottom: 12,
            color: "var(--text-secondary)",
            fontWeight: 500,
          }}
        >
          {t("pinEmergencyDesc")}
        </div>
        {!pinEmergencyConfirm ? (
          <Button variant="danger-soft" size="sm" onPress={() => setPinEmergencyConfirm(true)}>
            {t("pinEmergencyReset")}
          </Button>
        ) : (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              gap: 10,
            }}
          >
            <div
              style={{
                color: "var(--status-danger)",
                fontWeight: 600,
                fontSize: "var(--t12)",
              }}
            >
              {t("pinEmergencyConfirmText")}
            </div>
            <div className="flex gap-2">
              <Button
                variant="danger"
                size="sm"
                onPress={() => {
                  localStorage.removeItem("kiyoshi-pin-hash");
                  localStorage.removeItem("kiyoshi-pin-enabled");
                  localStorage.removeItem("kiyoshi-pin-type");
                  localStorage.removeItem("kiyoshi-pin-length");
                  setPinEnabled(false);
                  setPinVerified(true);
                  setPinDigits([]);
                  setPinPasswordInput("");
                  setPinSetup(null);
                  setPinSetupDigits([]);
                  setPinSetupPasswordInput("");
                  setPinSetupError("");
                  setPinEmergencyConfirm(false);
                }}
              >
                {t("pinEmergencyConfirm")}
              </Button>
              <Button variant="ghost" size="sm" onPress={() => setPinEmergencyConfirm(false)}>
                {t("cancel")}
              </Button>
            </div>
          </div>
        )}
      </CardRoot>
    </>
  );
}
