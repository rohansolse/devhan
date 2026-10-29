"use client";

import { useCallback, useEffect, useRef, useState } from "react";

type WedflixPreloaderProps = {
  /** Fired once the ident video has finished (or failed / timed out). */
  onFinish: () => void;
};

// Full-screen Netflix-style "ta-dum" ident that plays right after a profile is
// picked. Because selecting a profile is a user gesture, the browser lets the
// clip play with sound, so the sting comes from the video itself. The asset is
// self-hosted under public/; if it ever fails or stalls, the safety timer still
// reveals the page.
const PRELOADER_SRC = "/videos/preloader.mp4";
const MAX_WAIT = 5000;

export function WedflixPreloader({ onFinish }: WedflixPreloaderProps) {
  const [leaving, setLeaving] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const doneRef = useRef(false);

  const finish = useCallback(() => {
    if (doneRef.current) {
      return;
    }
    doneRef.current = true;
    setLeaving(true);
    window.setTimeout(onFinish, 500);
  }, [onFinish]);

  useEffect(() => {
    // Reveal the page even if the video never fires "ended" (network stall,
    // blocked autoplay, decode error).
    const safety = window.setTimeout(finish, MAX_WAIT);

    // Try to play with sound; if the browser blocks it, retry muted so the
    // animation still shows.
    const video = videoRef.current;
    video?.play().catch(() => {
      video.muted = true;
      video.play().catch(() => {});
    });

    return () => window.clearTimeout(safety);
  }, [finish]);

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center bg-black transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      aria-hidden
    >
      <video
        ref={videoRef}
        src={PRELOADER_SRC}
        className="h-full w-full object-cover"
        autoPlay
        playsInline
        preload="auto"
        onEnded={finish}
        onError={finish}
      />
    </div>
  );
}
