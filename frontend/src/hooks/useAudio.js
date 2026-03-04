import { useEffect, useRef } from "react";

export function useAudio(src) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.load();
    }
  }, [src]);

  return { audioRef };
}