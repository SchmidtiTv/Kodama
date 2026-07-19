import { useCallback, useEffect, useRef, useState } from "react";
import {
  Button,
  ColorAreaRoot,
  ColorAreaThumb,
  ColorSliderRoot,
  ColorSliderThumb,
  ColorSliderTrack,
  ColorSwatchRoot,
  Spinner,
  toast,
} from "@heroui/react";
import { parseColor } from "react-aria-components";
import { openUrl } from "@tauri-apps/plugin-opener";

import { BrandLastfm, Eyedropper } from "@/shared/icons/icons.jsx";
import { API } from "@/shared/api/client.js";
import { useLang } from "@/shared/i18n/context.jsx";
import { SettingRow } from "@/shared/ui/settings-controls.jsx";

import { ACCENT_PRESETS } from "./settings-constants.js";

export function AccentColorPicker({ value, onChange }) {
  const safe = /^#[0-9a-fA-F]{6}$/.test(value) ? value : "#e040fb";
  const [color, setColor] = useState(() => parseColor(safe).toFormat("hsb"));
  useEffect(() => {
    if (/^#[0-9a-fA-F]{6}$/.test(value)) {
      try {
        // This is a controlled color picker: external preset and reset actions must replace its
        // internal HSB value synchronously before the next interaction.
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setColor(parseColor(value).toFormat("hsb"));
      } catch {
        /* intentionally ignored */
      }
    }
  }, [value]);
  const apply = (nextColor) => {
    const hsb = nextColor.toFormat("hsb");
    setColor(hsb);
    onChange(hsb.toString("hex"));
  };
  const hex = color.toString("hex");
  return (
    <div className="flex gap-3 items-start mb-3.5">
      <div className="grid grid-cols-9 grid-rows-4 gap-1.5 flex-1 min-w-0 h-[210px]">
        {ACCENT_PRESETS.map((preset) => (
          <button
            key={preset.value}
            onClick={() => onChange(preset.value)}
            title={preset.label}
            className="w-full h-full rounded-md cursor-default transition-transform hover:scale-105 leading-[0]"
            style={
              value === preset.value
                ? { outline: `2.5px solid ${preset.value}`, outlineOffset: 2, borderRadius: 6 }
                : undefined
            }
          >
            <ColorSwatchRoot color={preset.value} shape="square" className="w-full! h-full!" />
          </button>
        ))}
      </div>
      <div className="w-px h-[210px] bg-border shrink-0" />
      <ColorSliderRoot
        aria-label="Hue"
        value={color}
        onChange={apply}
        channel="hue"
        colorSpace="hsb"
        orientation="vertical"
        className="w-7! h-[210px] shrink-0"
      >
        <ColorSliderTrack>
          <ColorSliderThumb />
        </ColorSliderTrack>
      </ColorSliderRoot>
      <div className="flex flex-col gap-2">
        <ColorAreaRoot
          aria-label="Saturation and brightness"
          value={color}
          onChange={apply}
          colorSpace="hsb"
          xChannel="saturation"
          yChannel="brightness"
          className="w-[210px] h-[210px] shrink-0 rounded-lg overflow-hidden"
        >
          <ColorAreaThumb />
        </ColorAreaRoot>
        <div className="flex items-center gap-1.5">
          <ColorSwatchRoot color={color} shape="square" size="sm" className="shrink-0" />
          <span className="text-t11 text-muted font-mono uppercase flex-1 truncate">{hex}</span>
          {window.EyeDropper && (
            <Button
              variant="ghost"
              size="sm"
              isIconOnly
              title="Pipette"
              onPress={async () => {
                try {
                  const { sRGBHex } = await new window.EyeDropper().open();
                  if (/^#[0-9a-fA-F]{6}$/.test(sRGBHex)) onChange(sRGBHex);
                } catch {
                  /* intentionally ignored */
                }
              }}
            >
              <Eyedropper size={14} />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}

export function LastfmRow() {
  const t = useLang();
  const [status, setStatus] = useState({ enabled: true, connected: false, username: "" });
  const [phase, setPhase] = useState("idle");
  const tokenRef = useRef(null);
  const loadStatus = useCallback(async () => {
    try {
      const response = await fetch(`${API}/lastfm/status`);
      const nextStatus = await response.json();
      setStatus(nextStatus);
      return nextStatus;
    } catch {
      return null;
    }
  }, []);
  useEffect(() => {
    loadStatus();
  }, [loadStatus]);
  const startConnect = async () => {
    setPhase("working");
    try {
      const data = await fetch(`${API}/lastfm/connect`).then((response) => response.json());
      if (data.error || !data.token) {
        toast.danger(t("lastfmError"));
        setPhase("idle");
        return;
      }
      tokenRef.current = data.token;
      await openUrl(data.authUrl).catch(() => {});
      setPhase("awaiting");
    } catch {
      toast.danger(t("lastfmError"));
      setPhase("idle");
    }
  };
  const finishConnect = async () => {
    setPhase("working");
    try {
      const data = await fetch(`${API}/lastfm/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: tokenRef.current }),
      }).then((response) => response.json());
      if (data.connected) {
        const savedStatus = await loadStatus();
        if (!savedStatus?.connected) {
          toast.danger(t("lastfmAuthFailed"));
          return;
        }
        window.dispatchEvent(new Event("lastfm-changed"));
        toast.success(t("lastfmConnected"));
      } else toast.danger(t("lastfmAuthFailed"));
    } catch {
      toast.danger(t("lastfmError"));
    }
    setPhase("idle");
  };
  const disconnect = async () => {
    try {
      await fetch(`${API}/lastfm/disconnect`, { method: "POST" });
    } catch {
      /* intentionally ignored */
    }
    setStatus((current) => ({ ...current, connected: false, username: "" }));
    window.dispatchEvent(new Event("lastfm-changed"));
    toast.success(t("lastfmDisconnected"));
  };
  const control = !status.enabled ? (
    <span className="text-t11 text-muted">{t("lastfmNotConfigured")}</span>
  ) : status.connected ? (
    <div className="flex items-center gap-2">
      <span className="text-t12 text-muted truncate max-w-[160px]">@{status.username}</span>
      <Button variant="danger-soft" size="sm" onPress={disconnect}>
        {t("disconnect")}
      </Button>
    </div>
  ) : phase === "awaiting" ? (
    <div className="flex items-center gap-2">
      <Button variant="ghost" size="sm" onPress={() => setPhase("idle")}>
        {t("cancel")}
      </Button>
      <Button variant="primary" size="sm" onPress={finishConnect}>
        {t("lastfmIveAuthorized")}
      </Button>
    </div>
  ) : (
    <Button variant="primary" size="sm" isDisabled={phase === "working"} onPress={startConnect}>
      {phase === "working" ? <Spinner size="sm" /> : t("connect")}
    </Button>
  );
  return (
    <SettingRow
      label="Last.fm"
      description={
        status.connected
          ? t("lastfmConnectedDesc")
          : phase === "awaiting"
            ? t("lastfmAwaitingDesc")
            : t("lastfmDesc")
      }
      icon={<BrandLastfm />}
    >
      {control}
    </SettingRow>
  );
}
