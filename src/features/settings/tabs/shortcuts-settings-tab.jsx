import { ArrowClockwise, Keyboard, PencilSimple, Trash, X } from "@/shared/icons/icons.jsx";
import { Button, CardRoot, KbdContent, KbdRoot, cn } from "@heroui/react";
import { DEFAULT_SHORTCUTS } from "../settings-constants.js";
import {
  SettingRow,
  SettingsSectionDesc,
  SettingsSectionLabel,
  Toggle,
} from "@/shared/ui/settings-controls.jsx";

const SHORTCUT_GROUPS = [
  {
    labelKey: "scGroupApplication",
    actions: [
      ["openSearch", "scOpenSearch"],
      ["openSettings", "scOpenSettings"],
      ["toggleSidebar", "scToggleSidebar"],
      ["toggleQueue", "scToggleQueue"],
      ["feedback", "scFeedback"],
    ],
  },
  {
    labelKey: "scGroupNavigation",
    actions: [
      ["goHome", "scGoHome"],
      ["openLibrary", "scOpenLibrary"],
      ["openLiked", "scOpenLiked"],
      ["openHistory", "scOpenHistory"],
      ["openDownloads", "scOpenDownloads"],
    ],
  },
  {
    labelKey: "scGroupPlayback",
    actions: [
      ["playPause", "scPlayPause"],
      ["nextTrack", "scNext"],
      ["prevTrack", "scPrev"],
      ["seekBack", "scSeekBack"],
      ["seekForward", "scSeekForward"],
    ],
  },
  {
    labelKey: "scGroupAudio",
    actions: [
      ["volUp", "scVolUp"],
      ["volDown", "scVolDown"],
      ["mute", "scMute"],
    ],
  },
  {
    labelKey: "scGroupInterface",
    actions: [
      ["fullscreen", "scFullscreen"],
      ["lyrics", "scToggleLyrics"],
      ["zoomIn", "scZoomIn"],
      ["zoomOut", "scZoomOut"],
    ],
  },
];

const SHORTCUT_ACTIONS = SHORTCUT_GROUPS.flatMap(({ actions }) => actions);

export function ShortcutsSettingsTab({
  customShortcuts,
  disableShortcut,
  getShortcutParts,
  onResetShortcuts,
  onShortcutsEnabledChange,
  recordingShortcut,
  resetShortcut,
  setRecordingShortcut,
  shortcutsEnabled,
  t,
}) {
  const labelsById = Object.fromEntries(
    SHORTCUT_ACTIONS.map(([id, labelKey]) => [id, t(labelKey)])
  );
  const activeCount = SHORTCUT_ACTIONS.filter(([id]) => customShortcuts[id]).length;
  const hasCustomShortcuts = SHORTCUT_ACTIONS.some(
    ([id]) => customShortcuts[id] !== DEFAULT_SHORTCUTS[id]
  );
  const conflictFor = (code, excludeId) => {
    if (!code) return null;
    const conflict = SHORTCUT_ACTIONS.find(
      ([id]) => id !== excludeId && customShortcuts[id] === code
    );
    return conflict ? labelsById[conflict[0]] : null;
  };

  return (
    <>
      <SettingsSectionLabel style={{ marginTop: 4 }}>{t("scAvailability")}</SettingsSectionLabel>
      <SettingRow
        label={t("scEnableShortcuts")}
        description={t("scEnableShortcutsDesc", {
          active: activeCount,
          total: SHORTCUT_ACTIONS.length,
        })}
        icon={<Keyboard />}
      >
        <Toggle
          value={shortcutsEnabled}
          onChange={onShortcutsEnabledChange}
          ariaLabel={t("scEnableShortcuts")}
        />
      </SettingRow>

      <SettingsSectionLabel>{t("scCustomize")}</SettingsSectionLabel>
      <SettingsSectionDesc>{t("scCustomizeDesc")}</SettingsSectionDesc>

      {SHORTCUT_GROUPS.map(({ labelKey, actions }, groupIndex) => (
        <div key={labelKey}>
          <div
            className="text-t11 font-semibold uppercase tracking-[0.08em] text-muted ml-0.5 mb-2"
            style={{ marginTop: groupIndex === 0 ? 4 : 18 }}
          >
            {t(labelKey)}
          </div>
          <div className="flex flex-col gap-1.5">
            {actions.map(([id]) => {
              const code = customShortcuts[id];
              const isRecording = recordingShortcut === id;
              const shortcutParts = getShortcutParts(code);
              const conflict = !isRecording && conflictFor(code, id);
              return (
                <CardRoot
                  key={id}
                  variant="secondary"
                  className={cn(
                    "bg-surface-1 flex flex-row items-center justify-between gap-3 px-[18px] py-3 border-2 transition-colors",
                    isRecording
                      ? "border-accent bg-accent-dim"
                      : conflict
                        ? "border-[rgba(255,100,100,0.45)]"
                        : "border-transparent"
                  )}
                >
                  <div className="min-w-0">
                    <div className={cn("text-t13", code ? "text-secondary" : "text-muted")}>
                      {labelsById[id]}
                    </div>
                    {conflict && (
                      <div className="text-t11 text-[rgb(255,130,130)] mt-0.5">
                        {t("scConflictWith", { action: conflict })}
                      </div>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0 ml-2">
                    {isRecording ? (
                      <span
                        className="text-t12 text-accent italic min-w-[150px] text-right"
                        aria-live="polite"
                      >
                        {t("scRecording")}
                      </span>
                    ) : !code ? (
                      <span className="text-t12 font-medium text-muted px-2">
                        {t("scDisabled")}
                      </span>
                    ) : (
                      <div className="flex items-center gap-1">
                        {shortcutParts.map((part, partIndex) => (
                          <KbdRoot
                            key={`${part}-${partIndex}`}
                            style={{ fontFamily: "var(--font)" }}
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

                    <Button
                      variant={isRecording ? "primary" : "ghost"}
                      size="sm"
                      isIconOnly
                      onPress={() => setRecordingShortcut(isRecording ? null : id)}
                      title={isRecording ? t("scCancelRecord") : t("scRecordBtn")}
                      aria-label={isRecording ? t("scCancelRecord") : t("scRecordBtn")}
                    >
                      {isRecording ? <X size={14} /> : <PencilSimple size={14} />}
                    </Button>

                    {code && !isRecording && (
                      <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        className="text-muted"
                        onPress={() => disableShortcut(id)}
                        title={t("scDisableShortcut")}
                        aria-label={t("scDisableShortcut")}
                      >
                        <Trash size={13} />
                      </Button>
                    )}

                    {customShortcuts[id] !== DEFAULT_SHORTCUTS[id] && !isRecording && (
                      <Button
                        variant="ghost"
                        size="sm"
                        isIconOnly
                        className="text-muted"
                        onPress={() => resetShortcut(id)}
                        title={t("scResetShortcut")}
                        aria-label={t("scResetShortcut")}
                      >
                        <ArrowClockwise size={14} />
                      </Button>
                    )}
                  </div>
                </CardRoot>
              );
            })}
          </div>
        </div>
      ))}

      <SettingsSectionDesc style={{ margin: "16px 0 0 2px" }}>
        {t("scDuplicateNote")}
      </SettingsSectionDesc>

      {hasCustomShortcuts && (
        <div className="mt-2">
          <Button variant="ghost" size="sm" onPress={onResetShortcuts}>
            <ArrowClockwise size={14} />
            {t("scResetAll")}
          </Button>
        </div>
      )}
    </>
  );
}
