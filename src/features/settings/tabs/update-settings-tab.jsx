import { APP_VERSION, FfmpegUpdateRow, YtDlpUpdateRow } from "../settings-support.jsx";
import {
  ArrowCircleUp,
  ArrowClockwise,
  CheckCircle,
  DownloadSimple,
  Info,
} from "@/shared/icons/icons.jsx";
import { Button, CardRoot, ProgressBar, ProgressBarFill, ProgressBarTrack } from "@heroui/react";
import { SettingRow } from "@/shared/ui/settings-controls.jsx";
import { renderNewsBody } from "@/shared/ui/news-body.jsx";
export function UpdateSettingsTab({
  checkingUpdate,
  onCancelDownload,
  onCheckUpdate,
  onDownloadUpdate,
  onInstallUpdate,
  setCheckingUpdate,
  t,
  updateDownloadProgress,
  updateDownloaded,
  updateDownloading,
  updateInfo,
}) {
  return (
    <>
      {/* Current version row */}
      <SettingRow label={t("currentVersion")} icon={<Info size={15} />}>
        <span
          style={{
            fontSize: 13,
            fontWeight: 600,
            color: "var(--t1)",
          }}
        >
          {APP_VERSION}
        </span>
      </SettingRow>

      {updateInfo ? (
        <>
          {/* New version card */}
          <CardRoot
            variant="secondary"
            className="px-[18px] py-3.5 gap-0! my-1.5"
            style={{
              background: "color-mix(in srgb, var(--accent) 8%, var(--surface-1))",
              border: "0.5px solid color-mix(in srgb, var(--accent) 40%, transparent)",
            }}
          >
            <div
              className="flex items-center gap-2.5"
              style={{
                marginBottom: updateInfo.releasedAt || updateInfo.changelog ? 10 : 0,
              }}
            >
              <ArrowCircleUp size={20} className="text-accent shrink-0" />
              <div>
                <div className="text-t15 font-bold text-accent">{updateInfo.version}</div>
                {updateInfo.releasedAt && (
                  <div className="text-t11 text-muted mt-0.5">
                    {t("released")}: {new Date(updateInfo.releasedAt).toLocaleDateString()}
                  </div>
                )}
              </div>
            </div>
            {updateInfo.changelog && (
              <>
                <div
                  className="h-px my-2.5"
                  style={{
                    background: "color-mix(in srgb, var(--accent) 25%, transparent)",
                  }}
                />
                <div className="text-t11 font-semibold text-muted mb-1.5">{t("changelog")}</div>
                <div className="text-t12 text-secondary leading-relaxed">
                  {renderNewsBody(updateInfo.changelog)}
                </div>
              </>
            )}
          </CardRoot>

          {/* Action area */}
          {updateDownloaded ? (
            <>
              <div
                className="text-t12 my-2 flex items-center gap-1.5"
                style={{
                  color: "var(--status-success)",
                }}
              >
                <CheckCircle size={14} weight="fill" />
                {t("savedToDownloads")}
              </div>
              <Button variant="primary" fullWidth onPress={onInstallUpdate}>
                <DownloadSimple size={16} />
                {t("installNow")}
              </Button>
            </>
          ) : updateDownloading ? (
            <>
              <div className="text-t12 text-muted my-2 flex items-center gap-1.5">
                <ArrowClockwise
                  size={13}
                  style={{
                    animation: "spin2 0.8s linear infinite",
                  }}
                />
                {t("downloadingUpdate")} — {updateDownloadProgress ?? 0}%
              </div>
              <ProgressBar
                aria-label="Update download"
                value={updateDownloadProgress ?? 0}
                className="w-full gap-0! mb-2.5"
              >
                <ProgressBarTrack className="h-[3px]!">
                  <ProgressBarFill />
                </ProgressBarTrack>
              </ProgressBar>
              <Button variant="ghost" fullWidth onPress={onCancelDownload}>
                {t("cancel")}
              </Button>
            </>
          ) : (
            <Button variant="primary" fullWidth className="mt-1.5" onPress={onDownloadUpdate}>
              <DownloadSimple size={16} />
              {t("downloadUpdate")}
            </Button>
          )}
        </>
      ) : (
        <div className="flex flex-col items-center gap-2.5 py-10 px-4 text-muted">
          <CheckCircle
            size={36}
            weight="fill"
            style={{
              color: "var(--status-success)",
            }}
          />
          <div className="text-t13 font-medium text-secondary text-center">{t("upToDate")}</div>
        </div>
      )}

      {/* Check for updates button */}
      <Button
        variant="ghost"
        fullWidth
        className="mt-1.5"
        isDisabled={checkingUpdate}
        onPress={() => {
          setCheckingUpdate(true);
          onCheckUpdate(true).finally(() => setCheckingUpdate(false));
        }}
      >
        <ArrowClockwise
          size={14}
          style={
            checkingUpdate
              ? {
                  animation: "spin2 0.8s linear infinite",
                }
              : undefined
          }
        />
        {checkingUpdate ? t("checking") : t("checkForUpdates")}
      </Button>

      {/* FFmpeg version + update */}
      <div className="h-px my-3.5 bg-border" />
      <FfmpegUpdateRow />

      {/* yt-dlp version + update (keep current when YouTube changes break playback) */}
      <YtDlpUpdateRow />
    </>
  );
}
