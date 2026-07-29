import { ArrowClockwise, PencilSimple, X } from "@/shared/icons/icons.jsx";
import { Button, CardRoot, KbdContent, KbdRoot, cn } from "@heroui/react";
import { DEFAULT_SHORTCUTS } from "../settings-constants.js";
import { SettingsSectionDesc } from "@/shared/ui/settings-controls.jsx";
export function ShortcutsSettingsTab({
  customShortcuts,
  getShortcutLabel,
  onResetShortcuts,
  recordingShortcut,
  resetShortcut,
  setRecordingShortcut,
  t,
}) {
  return (() => {
    const SHORTCUT_ACTIONS = [
      {
        id: "playPause",
        label: t("scPlayPause"),
      },
      {
        id: "nextTrack",
        label: t("scNext"),
      },
      {
        id: "prevTrack",
        label: t("scPrev"),
      },
      {
        id: "volUp",
        label: t("scVolUp"),
      },
      {
        id: "volDown",
        label: t("scVolDown"),
      },
      {
        id: "fullscreen",
        label: t("scFullscreen"),
      },
      {
        id: "mute",
        label: t("scMute"),
      },
      {
        id: "lyrics",
        label: t("scToggleLyrics"),
      },
      {
        id: "seekBack",
        label: t("scSeekBack"),
      },
      {
        id: "seekForward",
        label: t("scSeekForward"),
      },
      {
        id: "zoomIn",
        label: t("scZoomIn"),
      },
      {
        id: "zoomOut",
        label: t("scZoomOut"),
      },
    ];
    // Find conflict: which action uses the given code (excluding the one being checked)
    const conflictFor = (code, excludeId) =>
      SHORTCUT_ACTIONS.find((a) => a.id !== excludeId && customShortcuts[a.id] === code)?.label;
    return (
      <>
        <div className="flex flex-col gap-1.5">
          {SHORTCUT_ACTIONS.map(({ id, label, fixed }) => {
            const code = customShortcuts[id];
            const isRecording = recordingShortcut === id;
            const displayKey = getShortcutLabel(code);
            const conflict = !isRecording && conflictFor(code, id);
            return (
              <CardRoot
                key={id}
                variant="secondary"
                className={cn(
                  "bg-surface-1 flex flex-row items-center justify-between gap-3 px-[18px] py-3 border-2 transition-colors",
                  isRecording
                    ? "border-accent"
                    : conflict
                      ? "border-[rgba(255,100,100,0.45)]"
                      : "border-transparent"
                )}
              >
                <span className="text-t13 text-secondary">{label}</span>
                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isRecording ? (
                    <span className="text-t12 text-accent italic min-w-[100px] text-right">
                      {t("scRecording")}
                    </span>
                  ) : displayKey === "—" ? (
                    <span className="text-t14 font-semibold text-muted px-2">—</span>
                  ) : (
                    <div className="flex items-center gap-1">
                      {displayKey.split("+").map((part, ki) => (
                        <KbdRoot
                          key={ki}
                          style={{
                            fontFamily: "var(--font)",
                          }}
                          className={cn(
                            "text-t14 h-7 px-2.5 min-w-[30px] justify-center bg-surface-2!",
                            conflict ? "text-[rgb(255,130,130)]!" : "text-primary!"
                          )}
                        >
                          <KbdContent>{part}</KbdContent>
                        </KbdRoot>
                      ))}
                    </div>
                  )}
                  {!fixed && (
                    <Button
                      variant={isRecording ? "primary" : "ghost"}
                      size="sm"
                      isIconOnly
                      onPress={() => setRecordingShortcut(isRecording ? null : id)}
                      title={isRecording ? t("scCancelRecord") : t("scRecordBtn")}
                    >
                      {isRecording ? <X size={14} /> : <PencilSimple size={14} />}
                    </Button>
                  )}
                  {!fixed && customShortcuts[id] !== DEFAULT_SHORTCUTS[id] && !isRecording && (
                    <Button
                      variant="ghost"
                      size="sm"
                      isIconOnly
                      className="text-muted"
                      onPress={() => resetShortcut(id)}
                      title={t("scResetShortcut")}
                    >
                      <ArrowClockwise size={14} />
                    </Button>
                  )}
                </div>
              </CardRoot>
            );
          })}
        </div>
        <SettingsSectionDesc
          style={{
            margin: "16px 0 0 2px",
          }}
        >
          {t("shortcutsNote")}
        </SettingsSectionDesc>
        {Object.entries(customShortcuts).some(
          ([k, v]) => DEFAULT_SHORTCUTS[k] && v !== DEFAULT_SHORTCUTS[k]
        ) && (
          <div className="mt-2">
            <Button
              variant="ghost"
              size="sm"
              onPress={() => {
                onResetShortcuts?.({
                  ...DEFAULT_SHORTCUTS,
                });
                localStorage.setItem("kiyoshi-shortcuts", "{}");
              }}
            >
              <ArrowClockwise size={14} />
              {t("scResetAll")}
            </Button>
          </div>
        )}
      </>
    );
  })();
}
