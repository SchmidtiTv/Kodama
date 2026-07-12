import { useEffect, useState } from "react";

export function useSleepTimer({ audioRef, setIsPlaying }) {
  const [sleepTimerEnd, setSleepTimerEnd] = useState(null);
  const [sleepRemaining, setSleepRemaining] = useState(null);

  useEffect(() => {
    if (!sleepTimerEnd) {
      setSleepRemaining(null);
      return;
    }
    const tick = () => {
      const remaining = Math.max(0, Math.ceil((sleepTimerEnd - Date.now()) / 1000));
      setSleepRemaining(remaining);
      if (remaining <= 0) {
        audioRef.current?.pause();
        setIsPlaying(false);
        setSleepTimerEnd(null);
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [audioRef, setIsPlaying, sleepTimerEnd]);

  const formatSleepRemaining = (seconds) => {
    if (seconds === null) return null;
    const minutes = Math.floor(seconds / 60);
    return `${minutes}:${String(seconds % 60).padStart(2, "0")}`;
  };

  return { sleepTimerEnd, setSleepTimerEnd, sleepRemaining, formatSleepRemaining };
}
