import {
  cn,
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownPopover,
  DropdownSection,
  DropdownSubmenuIndicator,
  DropdownSubmenuTrigger,
  DropdownTrigger,
  toast,
} from "@heroui/react";

import {
  ArrowClockwise,
  Check,
  Copy,
  DotsThreeVertical,
  DownloadSimple,
  Heart,
  Microphone,
  MusicNote,
  Plus,
  ShareNodes,
  Translate,
  Trash,
  UploadSimple,
  VinylRecord,
} from "../../icons.jsx";
import { translate } from "../../i18n.js";
import { PROVIDER_SYNC } from "../../lyrics/providers.js";

export function PlayerActionsMenu(props) {
  const {
    buildShareLink,
    cachedSongIds,
    currentLyricsSource,
    downloadingIds,
    expanded,
    failedLyricsProviders,
    fetchMoreBrowseIds,
    fetchedBrowseIds,
    isCustomLyrics,
    isLiked,
    language,
    lyricsProviders,
    lyricsTranslationLang,
    onAddToPlaylist,
    onDownloadSong,
    onExpandToggle,
    onExportSong,
    onImportLyrics,
    onOpenAlbum,
    onOpenArtist,
    onRefetchLyrics,
    onRemoveCustomLyrics,
    onSetLyricsTranslationLang,
    onSwitchLyricsProvider,
    onToggleLyricsTranslation,
    showLyricsTranslation,
    t,
    toggleLike,
    track,
  } = props;

  const fetched = fetchedBrowseIds[track?.videoId] || {};
              const albumId = track.albumBrowseId || fetched.albumBrowseId;
              const artistId = track.artistBrowseId || fetched.artistBrowseId;
              const LANGS = [
                { code: "DE", name: "Deutsch" },
                { code: "EN", name: "English" },
                { code: "FR", name: "Français" },
                { code: "ES", name: "Español" },
                { code: "IT", name: "Italiano" },
                { code: "PT", name: "Português" },
                { code: "NL", name: "Nederlands" },
                { code: "PL", name: "Polski" },
                { code: "RU", name: "Русский" },
                { code: "JA", name: "日本語" },
                { code: "KO", name: "한국어" },
                { code: "ZH", name: "中文" },
              ];
              const downloaded = cachedSongIds?.has(track.videoId);
              const downloading = downloadingIds?.has(track.videoId);
              return (
                <Dropdown
                  onOpenChange={(open) => {
                    if (open) fetchMoreBrowseIds();
                  }}
                >
                  <DropdownTrigger
                    className="shrink-0 w-9 h-9 rounded-full flex items-center justify-center transition-colors duration-150 text-secondary hover:text-primary hover:bg-hover"
                    style={{ contain: "layout style" }}
                  >
                    <DotsThreeVertical size={18} />
                  </DropdownTrigger>
                  <DropdownPopover
                    placement="top end"
                    className="min-w-60 data-[entering]:animate-in data-[entering]:fade-in-0 data-[entering]:zoom-in-95 data-[entering]:slide-in-from-bottom-2 data-[entering]:duration-200 data-[exiting]:animate-out data-[exiting]:fade-out-0 data-[exiting]:zoom-out-95 data-[exiting]:duration-150"
                  >
                    <DropdownMenu aria-label="More">
                      {/* Add to Playlist (submenu) + Like */}
                      <DropdownSection>
                        <DropdownItem
                          textValue={t("addToPlaylist")}
                          onAction={() => onAddToPlaylist?.([track])}
                        >
                          <Plus size={14} />
                          {t("addToPlaylist")}
                        </DropdownItem>
                        <DropdownItem
                          textValue={isLiked ? t("unlike") : t("like")}
                          onAction={() => toggleLike()}
                          className={isLiked ? "text-accent" : undefined}
                        >
                          <Heart size={14} weight={isLiked ? "fill" : "regular"} />
                          {isLiked ? t("unlike") : t("like")}
                        </DropdownItem>
                      </DropdownSection>

                      {/* Navigation */}
                      {albumId || artistId ? (
                        <DropdownSection className="w-full border-t border-border mt-1 pt-1">
                          {albumId && onOpenAlbum ? (
                            <DropdownItem
                              textValue={translate(language, "goToAlbum")}
                              onAction={() => {
                                if (expanded) onExpandToggle();
                                onOpenAlbum({ browseId: albumId, title: track.album });
                              }}
                            >
                              <VinylRecord size={14} />
                              {translate(language, "goToAlbum")}
                            </DropdownItem>
                          ) : null}
                          {artistId && onOpenArtist ? (
                            <DropdownItem
                              textValue={translate(language, "goToArtist")}
                              onAction={() => {
                                if (expanded) onExpandToggle();
                                onOpenArtist({ browseId: artistId, artist: track.artists });
                              }}
                            >
                              <Microphone size={14} />
                              {translate(language, "goToArtist")}
                            </DropdownItem>
                          ) : null}
                        </DropdownSection>
                      ) : null}

                      {/* Lyrics actions */}
                      <DropdownSection className="w-full border-t border-border mt-1 pt-1">
                        <DropdownItem
                          textValue={translate(language, "refetchLyrics")}
                          onAction={() => onRefetchLyrics?.()}
                        >
                          <ArrowClockwise size={14} />
                          {translate(language, "refetchLyrics")}
                        </DropdownItem>
                        <DropdownItem
                          textValue={translate(language, "importLyrics")}
                          onAction={() => onImportLyrics?.()}
                        >
                          <UploadSimple size={14} />
                          {translate(language, "importLyrics")}
                        </DropdownItem>
                        {isCustomLyrics ? (
                          <DropdownItem
                            textValue={translate(language, "removeCustomLyrics")}
                            onAction={() => onRemoveCustomLyrics?.()}
                            className="text-[#f44336]"
                          >
                            <Trash size={14} />
                            {translate(language, "removeCustomLyrics")}
                          </DropdownItem>
                        ) : null}
                        <DropdownItem
                          textValue={translate(language, "translateLyrics")}
                          onAction={() => onToggleLyricsTranslation?.()}
                        >
                          <Translate size={14} />
                          {translate(language, "translateLyrics")}
                          {showLyricsTranslation && (
                            <Check size={12} className="ml-auto text-accent" />
                          )}
                        </DropdownItem>
                        {showLyricsTranslation ? (
                          <DropdownSubmenuTrigger>
                            <DropdownItem textValue="Language">
                              <Translate size={14} />
                              {LANGS.find((l) => l.code === lyricsTranslationLang)?.name ||
                                lyricsTranslationLang}
                              <DropdownSubmenuIndicator className="ml-auto" />
                            </DropdownItem>
                            <DropdownPopover className="min-w-40 max-h-80 overflow-y-auto">
                              <DropdownMenu aria-label="Language">
                                {LANGS.map(({ code, name }) => (
                                  <DropdownItem
                                    key={code}
                                    textValue={name}
                                    onAction={() => onSetLyricsTranslationLang?.(code)}
                                    className={
                                      lyricsTranslationLang === code
                                        ? "text-primary"
                                        : "text-secondary"
                                    }
                                  >
                                    {name}
                                    {lyricsTranslationLang === code && (
                                      <Check size={12} className="ml-auto text-accent" />
                                    )}
                                  </DropdownItem>
                                ))}
                              </DropdownMenu>
                            </DropdownPopover>
                          </DropdownSubmenuTrigger>
                        ) : null}
                      </DropdownSection>

                      {/* Lyrics provider switcher */}
                      <DropdownSection className="w-full border-t border-border mt-1 pt-1">
                        {lyricsProviders
                          .filter((p) => p.enabled)
                          .map((p) => {
                            const sync = PROVIDER_SYNC[p.id];
                            const isActive = currentLyricsSource === p.label;
                            const isFailed = failedLyricsProviders.has(p.id);
                            return (
                              <DropdownItem
                                key={p.id}
                                textValue={p.label}
                                isDisabled={isFailed}
                                onAction={() => {
                                  if (!isFailed) onSwitchLyricsProvider?.(p.id);
                                }}
                                className={cn(
                                  "text-t12",
                                  isActive ? "text-primary" : "text-secondary"
                                )}
                              >
                                <span className="flex-1">{p.label}</span>
                                {sync && (
                                  <span
                                    className="flex items-center gap-1.5 text-t10 px-1.5 py-0.5 rounded whitespace-nowrap"
                                    style={{ color: sync.color, background: sync.bg }}
                                  >
                                    {sync.icon && (
                                      <span
                                        className="inline-block w-4 h-4 shrink-0"
                                        style={{
                                          backgroundColor: "currentColor",
                                          maskImage: `url(${sync.icon})`,
                                          WebkitMaskImage: `url(${sync.icon})`,
                                          maskSize: "contain",
                                          WebkitMaskSize: "contain",
                                          maskRepeat: "no-repeat",
                                          WebkitMaskRepeat: "no-repeat",
                                          maskPosition: "center",
                                          WebkitMaskPosition: "center",
                                        }}
                                      />
                                    )}
                                    {sync.label}
                                  </span>
                                )}
                                {isActive && <Check size={12} className="text-accent shrink-0" />}
                              </DropdownItem>
                            );
                          })}
                      </DropdownSection>

                      {/* Download / Export */}
                      <DropdownSection className="w-full border-t border-border mt-1 pt-1">
                        {downloaded ? (
                          <DropdownItem textValue={translate(language, "downloaded")} isDisabled>
                            <DownloadSimple size={14} />
                            {translate(language, "downloaded")}
                          </DropdownItem>
                        ) : downloading ? (
                          <DropdownItem textValue={translate(language, "downloading")} isDisabled>
                            <DownloadSimple size={14} />
                            {translate(language, "downloading")}
                          </DropdownItem>
                        ) : (
                          <DropdownItem
                            textValue={translate(language, "download")}
                            onAction={() => onDownloadSong?.(track)}
                          >
                            <DownloadSimple size={14} />
                            {translate(language, "download")}
                          </DropdownItem>
                        )}
                        <DropdownItem
                          textValue={translate(language, "saveAsMp3")}
                          onAction={() => onExportSong?.(track, "mp3")}
                        >
                          <MusicNote size={14} />
                          {translate(language, "saveAsMp3")}
                        </DropdownItem>
                        <DropdownItem
                          textValue={translate(language, "saveAsOpus")}
                          onAction={() => onExportSong?.(track, "opus")}
                        >
                          <MusicNote size={14} />
                          {translate(language, "saveAsOpus")}
                        </DropdownItem>
                      </DropdownSection>

                      <DropdownSection className="w-full border-t border-border mt-1 pt-1">
                        <DropdownSubmenuTrigger>
                          <DropdownItem textValue={translate(language, "share")}>
                            <ShareNodes size={14} />
                            {translate(language, "share")}
                            <DropdownSubmenuIndicator className="ml-auto" />
                          </DropdownItem>
                          <DropdownPopover className="min-w-56">
                            <DropdownMenu aria-label={translate(language, "share")}>
                              <DropdownSection>
                                <DropdownItem
                                  textValue={translate(language, "copyShareLink")}
                                  onAction={() =>
                                    navigator.clipboard
                                      .writeText(buildShareLink(track))
                                      .then(() => toast.success(translate(language, "linkCopied")))
                                      .catch(() => {})
                                  }
                                >
                                  <ShareNodes size={14} />
                                  {translate(language, "copyShareLink")}
                                </DropdownItem>
                                <DropdownItem
                                  textValue={translate(language, "copyKodamaLink")}
                                  onAction={() =>
                                    navigator.clipboard
                                      .writeText(`kodama://song/${track.videoId}`)
                                      .then(() => toast.success(translate(language, "linkCopied")))
                                      .catch(() => {})
                                  }
                                >
                                  <Copy size={14} />
                                  {translate(language, "copyKodamaLink")}
                                </DropdownItem>
                                <DropdownItem
                                  textValue={translate(language, "copyYtMusicLink")}
                                  onAction={() =>
                                    navigator.clipboard
                                      .writeText(
                                        `https://music.youtube.com/watch?v=${track.videoId}`
                                      )
                                      .then(() => toast.success(translate(language, "linkCopied")))
                                      .catch(() => {})
                                  }
                                >
                                  <Copy size={14} />
                                  {translate(language, "copyYtMusicLink")}
                                </DropdownItem>
                                <DropdownItem
                                  textValue={translate(language, "copyYoutubeLink")}
                                  onAction={() =>
                                    navigator.clipboard
                                      .writeText(`https://youtube.com/watch?v=${track.videoId}`)
                                      .then(() => toast.success(translate(language, "linkCopied")))
                                      .catch(() => {})
                                  }
                                >
                                  <Copy size={14} />
                                  {translate(language, "copyYoutubeLink")}
                                </DropdownItem>
                              </DropdownSection>
                            </DropdownMenu>
                          </DropdownPopover>
                        </DropdownSubmenuTrigger>
                      </DropdownSection>
                    </DropdownMenu>
                  </DropdownPopover>
                </Dropdown>
              );

}
