import {
  Button,
  CardRoot,
  Dropdown,
  DropdownItem,
  DropdownPopover,
  DropdownTrigger,
} from "@heroui/react";
import { DropdownMenu } from "@/shared/ui/zoomed-heroui.jsx";
import { thumb } from "@/shared/api/thumbnails.js";
import {
  ArrowsOut,
  CaretUp,
  ChatText,
  ClapperboardPlay,
  DotsThreeVertical,
  HeadphonesSimple,
  Heart,
  Moon,
  MusicNote,
  Play,
  Plus,
  Queue,
  Repeat,
  Shuffle,
  SkipBack,
  SkipForward,
  SpeakerHigh,
  X,
} from "@/shared/icons/icons.jsx";

const CONTROL_OPTIONS = [
  { id: "artwork", label: "playerBarArtwork", icon: <MusicNote size={15} /> },
  { id: "trackDetails", label: "playerBarTrackDetails", icon: <MusicNote size={15} /> },
  { id: "like", label: "playerBarLike", icon: <Heart size={15} /> },
  { id: "shuffle", label: "playerBarShuffle", icon: <Shuffle size={15} /> },
  { id: "repeat", label: "playerBarRepeat", icon: <Repeat size={15} /> },
  { id: "volume", label: "playerBarVolume", icon: <SpeakerHigh size={15} /> },
  { id: "sleepTimer", label: "playerBarSleepTimer", icon: <Moon size={15} /> },
  { id: "queue", label: "playerBarQueue", icon: <Queue size={15} /> },
  { id: "lyrics", label: "playerBarLyrics", icon: <ChatText size={15} /> },
  { id: "videoToggle", label: "playerBarVideoToggle", icon: <HeadphonesSimple size={15} /> },
  { id: "fullscreen", label: "playerBarFullscreen", icon: <ArrowsOut size={15} /> },
];

function RemovableControl({ control, onRemove, t, children }) {
  return (
    <div className="relative flex shrink-0 items-center justify-center">
      <Button
        variant="ghost"
        isIconOnly
        size="sm"
        aria-label={`${t("playerBarRemoveControl")} ${t(control.label)}`}
        data-testid={`player-bar-remove-${control.id}`}
        onPress={() => onRemove(control.id)}
        className="absolute -top-5 z-10 h-5 min-w-5 rounded-full border border-border bg-elevated text-muted shadow-sm hover:border-[#ff7777]/60! hover:bg-[#ff7777]/10! hover:text-[#ff7777]!"
      >
        <X size={10} />
      </Button>
      {children}
    </div>
  );
}

function PreviewIconButton({ children, accent = false, wide = false }) {
  return (
    <div
      className={`flex h-9 ${wide ? "w-[60px]" : "w-9"} items-center justify-center rounded-full ${
        accent
          ? "bg-accent text-white shadow-[0_4px_12px_color-mix(in_srgb,var(--accent)_40%,transparent)]"
          : "text-secondary"
      }`}
    >
      {children}
    </div>
  );
}

export function PlayerBarCustomizer({ controls, onToggleControl, t, track }) {
  const hiddenControls = CONTROL_OPTIONS.filter((control) => !controls[control.id]);
  const optionFor = (id) => CONTROL_OPTIONS.find((control) => control.id === id);
  const visible = (id) => controls[id];
  const title = track?.title || t("nowPlaying");
  const artist = track?.artists || "Artist";

  return (
    <CardRoot
      variant="secondary"
      data-testid="player-bar-customizer"
      className="bg-surface-1 gap-0! p-0! overflow-hidden"
    >
      <div className="flex items-start justify-between gap-4 px-[18px] pt-4 pb-3">
        <div>
          <div className="text-t13 font-medium text-primary">{t("customizePlayerBar")}</div>
          <div className="text-t11 text-muted mt-0.5 leading-snug">
            {t("customizePlayerBarDesc")}
          </div>
        </div>
        <Dropdown>
          <DropdownTrigger data-testid="player-bar-add-control">
            <Button
              variant="secondary"
              size="sm"
              isDisabled={hiddenControls.length === 0}
              className="shrink-0"
            >
              <Plus size={13} />
              {t("addPlayerBarControl")}
            </Button>
          </DropdownTrigger>
          <DropdownPopover placement="bottom end" className="min-w-48">
            <DropdownMenu aria-label={t("addPlayerBarControl")}>
              {hiddenControls.map((control) => (
                <DropdownItem
                  key={control.id}
                  id={control.id}
                  data-testid={`player-bar-add-${control.id}`}
                  textValue={t(control.label)}
                  onAction={() => onToggleControl(control.id)}
                >
                  {control.icon}
                  {t(control.label)}
                </DropdownItem>
              ))}
            </DropdownMenu>
          </DropdownPopover>
        </Dropdown>
      </div>

      <div className="px-3 pb-3">
        <div className="mb-2 px-1 text-t11 font-medium text-secondary">{t("playerBarPreview")}</div>
        <div
          className="overflow-x-auto rounded-2xl border border-border shadow-inner"
          style={{
            background:
              "linear-gradient(105deg, color-mix(in srgb, var(--accent) 16%, var(--bg-elevated)), var(--bg-elevated))",
          }}
        >
          <div className="flex h-[112px] min-w-[900px] items-center gap-4 px-4 pt-5">
            <div className="flex w-[300px] min-w-0 items-center gap-3">
              {visible("artwork") && (
                <RemovableControl control={optionFor("artwork")} onRemove={onToggleControl} t={t}>
                  <div className="h-16 w-16 overflow-hidden rounded-xl bg-elevated">
                    {track?.thumbnail ? (
                      <img
                        src={thumb(track.thumbnail)}
                        alt=""
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="h-full w-full bg-[linear-gradient(135deg,#47215a,#1b2746)]" />
                    )}
                  </div>
                </RemovableControl>
              )}
              {visible("trackDetails") && (
                <RemovableControl
                  control={optionFor("trackDetails")}
                  onRemove={onToggleControl}
                  t={t}
                >
                  <div className="w-[148px] min-w-0">
                    <div className="truncate text-t13 font-medium text-primary">{title}</div>
                    <div className="mt-0.5 truncate text-t11 text-secondary">{artist}</div>
                    <div className="mt-1 text-t10 text-muted">0:00 / 0:00</div>
                  </div>
                </RemovableControl>
              )}
              {visible("like") && (
                <RemovableControl control={optionFor("like")} onRemove={onToggleControl} t={t}>
                  <PreviewIconButton accent>
                    <Heart size={17} weight="fill" />
                  </PreviewIconButton>
                </RemovableControl>
              )}
            </div>

            <div className="flex flex-1 items-center justify-center gap-1">
              {visible("shuffle") && (
                <RemovableControl control={optionFor("shuffle")} onRemove={onToggleControl} t={t}>
                  <PreviewIconButton>
                    <Shuffle size={16} />
                  </PreviewIconButton>
                </RemovableControl>
              )}
              <PreviewIconButton>
                <SkipBack size={20} />
              </PreviewIconButton>
              <PreviewIconButton accent wide>
                <Play size={18} weight="fill" />
              </PreviewIconButton>
              <PreviewIconButton>
                <SkipForward size={20} />
              </PreviewIconButton>
              {visible("repeat") && (
                <RemovableControl control={optionFor("repeat")} onRemove={onToggleControl} t={t}>
                  <PreviewIconButton>
                    <Repeat size={16} />
                  </PreviewIconButton>
                </RemovableControl>
              )}
            </div>

            <div className="flex w-[340px] items-center justify-end gap-1">
              {visible("volume") && (
                <RemovableControl control={optionFor("volume")} onRemove={onToggleControl} t={t}>
                  <div className="flex items-center gap-2">
                    <PreviewIconButton>
                      <SpeakerHigh size={16} />
                    </PreviewIconButton>
                    <div className="h-1.5 w-[72px] overflow-hidden rounded-full bg-white/15">
                      <div className="h-full w-3/5 rounded-full bg-accent" />
                    </div>
                  </div>
                </RemovableControl>
              )}
              {visible("sleepTimer") && (
                <RemovableControl
                  control={optionFor("sleepTimer")}
                  onRemove={onToggleControl}
                  t={t}
                >
                  <PreviewIconButton>
                    <Moon size={15} />
                  </PreviewIconButton>
                </RemovableControl>
              )}
              <PreviewIconButton>
                <DotsThreeVertical size={17} />
              </PreviewIconButton>
              {visible("queue") && (
                <RemovableControl control={optionFor("queue")} onRemove={onToggleControl} t={t}>
                  <PreviewIconButton>
                    <Queue size={17} />
                  </PreviewIconButton>
                </RemovableControl>
              )}
              {visible("lyrics") && (
                <RemovableControl control={optionFor("lyrics")} onRemove={onToggleControl} t={t}>
                  <PreviewIconButton>
                    <ChatText size={17} />
                  </PreviewIconButton>
                </RemovableControl>
              )}
              {visible("videoToggle") && (
                <RemovableControl
                  control={optionFor("videoToggle")}
                  onRemove={onToggleControl}
                  t={t}
                >
                  <div className="flex h-7 w-11 items-center justify-end rounded-full bg-white/10 px-1">
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-surface-1 text-secondary">
                      <ClapperboardPlay size={11} />
                    </span>
                  </div>
                </RemovableControl>
              )}
              <PreviewIconButton>
                <CaretUp size={15} />
              </PreviewIconButton>
              {visible("fullscreen") && (
                <RemovableControl
                  control={optionFor("fullscreen")}
                  onRemove={onToggleControl}
                  t={t}
                >
                  <PreviewIconButton>
                    <ArrowsOut size={17} />
                  </PreviewIconButton>
                </RemovableControl>
              )}
            </div>
          </div>
        </div>
      </div>
    </CardRoot>
  );
}
