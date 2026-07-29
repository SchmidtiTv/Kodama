import { Button } from "@heroui/react";
import { Lock } from "@/shared/icons/icons.jsx";
import { PasswordEntryInput, PinDots, PinKeypad } from "../pin-controls.jsx";
export function SettingsLockDialogs({
  PIN_EMERGENCY_TAPS,
  PIN_LEN,
  advanceSetup,
  anim,
  handlePinKey,
  handleSetupKey,
  pinDigits,
  pinEmergencyConfirm,
  pinEnabled,
  pinError,
  pinLockTapTimer,
  pinLockTaps,
  pinPasswordInput,
  pinSetup,
  pinSetupDigits,
  pinSetupError,
  pinSetupPasswordInput,
  pinShake,
  pinType,
  pinVerified,
  setPinDigits,
  setPinEmergencyConfirm,
  setPinEnabled,
  setPinLockTaps,
  setPinPasswordInput,
  setPinSetup,
  setPinSetupDigits,
  setPinSetupError,
  setPinSetupPasswordInput,
  setPinVerified,
  setShowPinPassword,
  setShowSetupPassword,
  showPinPassword,
  showSetupPassword,
  submitPinEntry,
  t,
}) {
  return (
    <>
      {pinEnabled && !pinVerified && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 20,
            borderRadius: "var(--r-xl)",
            background: "var(--bg-base)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            animation: anim ? "fadeIn 0.18s ease" : undefined,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 12,
            }}
          >
            <div
              onClick={() => {
                const next = pinLockTaps + 1;
                setPinLockTaps(next);
                clearTimeout(pinLockTapTimer.current);
                if (next >= PIN_EMERGENCY_TAPS) {
                  setPinLockTaps(0);
                  setPinEmergencyConfirm(true);
                } else {
                  pinLockTapTimer.current = setTimeout(() => setPinLockTaps(0), 2000);
                }
              }}
              style={{
                cursor: "default",
                userSelect: "none",
              }}
            >
              <Lock
                size={36}
                style={{
                  color: "var(--accent)",
                }}
              />
            </div>
            <div
              style={{
                fontSize: "var(--t18)",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              Kodama
            </div>
            <div
              style={{
                fontSize: "var(--t13)",
                color: "var(--text-muted)",
              }}
            >
              {t("pinEnterPrompt")}
            </div>
          </div>

          <div
            style={{
              animation: pinShake ? "pinShake 0.5s ease" : undefined,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 20,
            }}
          >
            {pinType === "pin" ? (
              <>
                <PinDots count={PIN_LEN} filled={pinDigits.length} />
                {pinError && (
                  <div
                    style={{
                      fontSize: "var(--t12)",
                      color: "var(--status-danger)",
                      fontWeight: 500,
                    }}
                  >
                    {t("pinWrong")}
                  </div>
                )}
              </>
            ) : (
              <PasswordEntryInput
                value={pinPasswordInput}
                onChange={(v) => {
                  if (!pinError) setPinPasswordInput(v);
                }}
                onSubmit={async (val) => {
                  setPinPasswordInput("");
                  await submitPinEntry(val);
                }}
                show={showPinPassword}
                onToggleShow={() => setShowPinPassword((v) => !v)}
                error={pinError ? t("pinWrong") : ""}
                autoFocus
                submitLabel={t("pinSubmit")}
              />
            )}
          </div>

          {pinType === "pin" && <PinKeypad onKey={handlePinKey} />}

          {/* ── Emergency reset — only visible after 7 secret taps on the lock icon ── */}
          {pinEmergencyConfirm && (
            <div
              style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: 12,
                background: "var(--status-danger-soft)",
                border: "0.5px solid var(--status-danger-line)",
                borderRadius: "var(--r-xl)",
                padding: "16px 24px",
                marginTop: 8,
              }}
            >
              <div
                style={{
                  fontSize: "var(--t12)",
                  color: "var(--status-danger)",
                  fontWeight: 600,
                  textAlign: "center",
                  maxWidth: 280,
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
        </div>
      )}
      {pinSetup && (
        <div
          style={{
            position: "absolute",
            inset: 0,
            zIndex: 30,
            borderRadius: "var(--r-xl)",
            background: "color-mix(in srgb, var(--bg-base) 92%, transparent)",
            backdropFilter: "blur(8px)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            justifyContent: "center",
            gap: 24,
            animation: anim ? "fadeIn 0.18s ease" : undefined,
          }}
        >
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 8,
            }}
          >
            <div
              style={{
                fontSize: "var(--t16)",
                fontWeight: 700,
                color: "var(--text-primary)",
              }}
            >
              {pinSetup.step === "current"
                ? t("pinEnterCurrent")
                : pinSetup.step === "new"
                  ? t("pinEnterNew")
                  : t("pinConfirmNew")}
            </div>
          </div>

          {/* current step: use stored pinType; new/confirm: use selected pinType */}
          {(pinSetup.step === "current" ? pinType : pinType) === "pin" ? (
            <>
              <PinDots count={PIN_LEN} filled={pinSetupDigits.length} />
              {pinSetupError && (
                <div
                  style={{
                    fontSize: "var(--t12)",
                    color: "var(--status-danger)",
                    fontWeight: 500,
                  }}
                >
                  {pinSetupError}
                </div>
              )}
              <PinKeypad onKey={handleSetupKey} />
            </>
          ) : (
            <PasswordEntryInput
              value={pinSetupPasswordInput}
              onChange={(v) => {
                setPinSetupPasswordInput(v);
                setPinSetupError("");
              }}
              onSubmit={async (val) => {
                setPinSetupPasswordInput("");
                await advanceSetup(val);
              }}
              show={showSetupPassword}
              onToggleShow={() => setShowSetupPassword((v) => !v)}
              error={pinSetupError}
              autoFocus
              submitLabel={t("pinSubmit")}
            />
          )}

          <Button
            variant="ghost"
            size="sm"
            onPress={() => {
              setPinSetup(null);
              setPinSetupDigits([]);
              setPinSetupError("");
            }}
          >
            {t("cancel")}
          </Button>
        </div>
      )}
    </>
  );
}
