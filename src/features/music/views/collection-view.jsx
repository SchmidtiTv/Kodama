import { PlaylistLayout } from "@/features/music/components/track-table.jsx";
import { useDownloadActions } from "@/features/downloads/download-context.jsx";

export function CollectionView({
  title,
  thumbnail,
  playlistId,
  tracks,
  total,
  loading,
  progress,
  cached,
  onBack,
  onOpenArtist,
  onOpenAlbum,
  isAlbum,
  albumArtists,
  albumArtistBrowseId,
  year,
  onRefresh,
  onTrackContextMenu,
  hideExplicit,
  onToggleLike,
  likedIds,
  selectedTracks,
  onToggleSelect,
  onSelectAll,
  browseId,
  onCollectionActions,
}) {
  // "Download all" needs this collection's own title/thumbnail/artists metadata, so it's built
  // here rather than sourced from DownloadContext.
  const { downloadAll, removeAll } = useDownloadActions();
  return (
    <PlaylistLayout
      title={title}
      thumbnail={thumbnail}
      playlistId={playlistId}
      tracks={tracks}
      total={total}
      loading={loading}
      progress={progress}
      cached={cached}
      onBack={onBack}
      onOpenArtist={onOpenArtist}
      onOpenAlbum={onOpenAlbum}
      isAlbum={isAlbum}
      albumArtists={albumArtists}
      albumArtistBrowseId={albumArtistBrowseId}
      year={year}
      onRefresh={onRefresh}
      onTrackContextMenu={onTrackContextMenu}
      onDownloadAll={(tracks) =>
        downloadAll(tracks, { title, thumbnail, artists: albumArtists || "" })
      }
      onRemoveAll={removeAll}
      hideExplicit={hideExplicit}
      onToggleLike={onToggleLike}
      likedIds={likedIds}
      selectedTracks={selectedTracks}
      onToggleSelect={onToggleSelect}
      onSelectAll={onSelectAll}
      onCollectionActions={(event) =>
        onCollectionActions?.(event, {
          ...(isAlbum ? { browseId, type: "album" } : { playlistId }),
          title,
          thumbnail,
        })
      }
    />
  );
}
