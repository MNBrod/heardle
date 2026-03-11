import { useEffect, useRef } from "react";

const MEDIA_ERROR_CODES = {
  1: "MEDIA_ERR_ABORTED",
  2: "MEDIA_ERR_NETWORK",
  3: "MEDIA_ERR_DECODE",
  4: "MEDIA_ERR_SRC_NOT_SUPPORTED",
};

export function useAudio(src) {
  const audioRef = useRef(null);

  useEffect(() => {
    if (audioRef.current && src) {
      audioRef.current.load();
    }
  }, [src]);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    function handleError() {
      const err = audio.error;
      if (!err) return;
      console.error("[AudioPlayer] Media error", {
        src,
        code: err.code,
        name: MEDIA_ERROR_CODES[err.code] ?? "UNKNOWN",
        message: err.message,
      });
    }

    audio.addEventListener("error", handleError);
    return () => audio.removeEventListener("error", handleError);
  }, [src]);

  return { audioRef };
}