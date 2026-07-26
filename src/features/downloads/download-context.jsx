/* eslint-disable react-refresh/only-export-components */
import { createContext, useContext, useMemo } from "react";

const DownloadStateContext = createContext(null);
const DownloadActionsContext = createContext(null);

function useRequired(context, name) {
  const value = useContext(context);
  if (!value) throw new Error(`${name} must be used within a DownloadProvider`);
  return value;
}

export function DownloadProvider({ controller, children }) {
  const {
    cachedSongIds,
    downloadingIds,
    premiumSongIds,
    handleDownloadSong,
    handleDownloadAll,
    handleRemoveAllDownloads,
    handleExportSong,
    removeCachedSong,
    markPremium,
  } = controller;

  const state = useMemo(
    () => ({ cachedSongIds, downloadingIds, premiumSongIds }),
    [cachedSongIds, downloadingIds, premiumSongIds]
  );
  const actions = useMemo(
    () => ({
      downloadSong: handleDownloadSong,
      downloadAll: handleDownloadAll,
      removeAll: handleRemoveAllDownloads,
      exportSong: handleExportSong,
      removeCachedSong,
      markPremium,
    }),
    [
      handleDownloadSong,
      handleDownloadAll,
      handleRemoveAllDownloads,
      handleExportSong,
      removeCachedSong,
      markPremium,
    ]
  );

  return (
    <DownloadStateContext.Provider value={state}>
      <DownloadActionsContext.Provider value={actions}>{children}</DownloadActionsContext.Provider>
    </DownloadStateContext.Provider>
  );
}

export const useDownloadState = () => useRequired(DownloadStateContext, "useDownloadState");
export const useDownloadActions = () => useRequired(DownloadActionsContext, "useDownloadActions");
