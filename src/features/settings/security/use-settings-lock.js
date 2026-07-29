import { useEffect, useRef, useState } from "react";
async function hashPin(pin) {
  const buffer = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(pin));
  return Array.from(new Uint8Array(buffer))
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}
export function useSettingsLock(t) {
  // ── PIN protection state ──────────────────────────────────────────────────
  const [pinEnabled, setPinEnabled] = useState(
    () => localStorage.getItem("kiyoshi-pin-enabled") === "true"
  );
  const [pinVerified, setPinVerified] = useState(
    () => localStorage.getItem("kiyoshi-pin-enabled") !== "true"
  );
  const [pinDigits, setPinDigits] = useState([]);
  const [pinError, setPinError] = useState(false);
  const [pinShake, setPinShake] = useState(false);
  // Setup / change dialog
  const [pinSetup, setPinSetup] = useState(null); // null | { mode:"enable"|"change"|"disable", step:"current"|"new"|"confirm", first:string|null }
  const [pinSetupDigits, setPinSetupDigits] = useState([]);
  const [pinSetupError, setPinSetupError] = useState("");
  // PIN type: "pin" (keypad) or "password" (text input)
  const [pinType, setPinType] = useState(() => localStorage.getItem("kiyoshi-pin-type") || "pin");
  // PIN length: 4 or 6 digits (only relevant when pinType === "pin")
  const [pinLength, setPinLength] = useState(() =>
    parseInt(localStorage.getItem("kiyoshi-pin-length") || "4", 10)
  );
  const [pinPasswordInput, setPinPasswordInput] = useState("");
  const [pinSetupPasswordInput, setPinSetupPasswordInput] = useState("");
  const [showPinPassword, setShowPinPassword] = useState(false);
  const [showSetupPassword, setShowSetupPassword] = useState(false);
  const [pinEmergencyConfirm, setPinEmergencyConfirm] = useState(false);
  const [pinLockTaps, setPinLockTaps] = useState(0);
  const pinLockTapTimer = useRef(null);
  const PIN_EMERGENCY_TAPS = 7;
  const PIN_LEN = pinLength;
  const submitPinEntry = async (input) => {
    const stored = localStorage.getItem("kiyoshi-pin-hash");
    const hash = await hashPin(input);
    if (hash === stored) {
      setPinVerified(true);
      setPinDigits([]);
      setPinPasswordInput("");
    } else {
      setPinShake(true);
      setPinError(true);
      setPinDigits([]);
      setPinPasswordInput("");
      setTimeout(() => {
        setPinShake(false);
        setPinError(false);
      }, 700);
    }
  };
  const handlePinKey = (key) => {
    if (pinError) return;
    if (key === "del") {
      setPinDigits((d) => d.slice(0, -1));
      return;
    }
    setPinDigits((prev) => {
      if (prev.length >= PIN_LEN) return prev;
      const next = [...prev, key];
      if (next.length === PIN_LEN) setTimeout(() => submitPinEntry(next.join("")), 80);
      return next;
    });
  };
  const handleSetupKey = async (key) => {
    if (key === "del") {
      setPinSetupDigits((d) => d.slice(0, -1));
      setPinSetupError("");
      return;
    }
    setPinSetupDigits((prev) => {
      if (prev.length >= PIN_LEN) return prev;
      const next = [...prev, key];
      if (next.length === PIN_LEN) {
        setTimeout(() => advanceSetup(next.join("")), 80);
      }
      return next;
    });
  };
  const advanceSetup = async (input) => {
    const { mode, step, first } = pinSetup;
    const resetSetupInputs = () => {
      setPinSetupDigits([]);
      setPinSetupPasswordInput("");
    };
    if (step === "current") {
      const hash = await hashPin(input);
      if (hash !== localStorage.getItem("kiyoshi-pin-hash")) {
        setPinSetupError(t("pinWrong"));
        resetSetupInputs();
        return;
      }
      setPinSetup((s) => ({
        ...s,
        step: mode === "disable" ? "done" : "new",
      }));
      if (mode === "disable") {
        localStorage.removeItem("kiyoshi-pin-hash");
        localStorage.removeItem("kiyoshi-pin-enabled");
        localStorage.removeItem("kiyoshi-pin-type");
        localStorage.removeItem("kiyoshi-pin-length");
        setPinEnabled(false);
        setPinSetup(null);
        resetSetupInputs();
        return;
      }
      resetSetupInputs();
      setPinSetupError("");
      return;
    }
    if (step === "new") {
      setPinSetup((s) => ({
        ...s,
        step: "confirm",
        first: input,
      }));
      resetSetupInputs();
      setPinSetupError("");
      return;
    }
    if (step === "confirm") {
      if (input !== first) {
        setPinSetupError(t("pinMismatch"));
        resetSetupInputs();
        setPinSetup((s) => ({
          ...s,
          step: "new",
          first: null,
        }));
        return;
      }
      const hash = await hashPin(input);
      localStorage.setItem("kiyoshi-pin-hash", hash);
      localStorage.setItem("kiyoshi-pin-enabled", "true");
      localStorage.setItem("kiyoshi-pin-type", pinType);
      if (pinType === "pin") localStorage.setItem("kiyoshi-pin-length", String(pinLength));
      setPinEnabled(true);
      setPinVerified(true);
      setPinSetup(null);
      resetSetupInputs();
      setPinSetupError("");
    }
  };

  // ── Keyboard support for PIN entry / setup ───────────────────────────────
  useEffect(() => {
    if (pinType !== "pin") return; // password mode uses native <input>
    const isEntryActive = pinEnabled && !pinVerified && !pinSetup;
    const isSetupActive = !!pinSetup;
    if (!isEntryActive && !isSetupActive) return;
    const onKey = (e) => {
      if (e.repeat) return;
      const digit = parseInt(e.key, 10);
      if (!isNaN(digit) && e.key.length === 1) {
        if (isEntryActive) handlePinKey(digit);
        else handleSetupKey(digit);
      } else if (e.key === "Backspace") {
        if (isEntryActive) handlePinKey("del");
        else handleSetupKey("del");
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [pinType, pinEnabled, pinVerified, pinSetup, pinError]);
  return {
    pinEnabled,
    setPinEnabled,
    pinVerified,
    setPinVerified,
    pinDigits,
    setPinDigits,
    pinError,
    setPinError,
    pinShake,
    setPinShake,
    pinSetup,
    setPinSetup,
    pinSetupDigits,
    setPinSetupDigits,
    pinSetupError,
    setPinSetupError,
    pinType,
    setPinType,
    pinLength,
    setPinLength,
    pinPasswordInput,
    setPinPasswordInput,
    pinSetupPasswordInput,
    setPinSetupPasswordInput,
    showPinPassword,
    setShowPinPassword,
    showSetupPassword,
    setShowSetupPassword,
    pinEmergencyConfirm,
    setPinEmergencyConfirm,
    pinLockTaps,
    setPinLockTaps,
    pinLockTapTimer,
    PIN_EMERGENCY_TAPS,
    PIN_LEN,
    submitPinEntry,
    handlePinKey,
    handleSetupKey,
    advanceSetup,
  };
}
