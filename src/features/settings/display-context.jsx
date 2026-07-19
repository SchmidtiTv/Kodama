import { createContext, useContext } from "react";

export const AnimationContext = createContext(true);
export const useAnimations = () => useContext(AnimationContext);

export const ZoomContext = createContext(1);
export const useZoom = () => useContext(ZoomContext);

export const FontScaleContext = createContext(1);
export const useFontScale = () => useContext(FontScaleContext);

export const TrackNumberContext = createContext(false);
export const useTrackNumbers = () => useContext(TrackNumberContext);
