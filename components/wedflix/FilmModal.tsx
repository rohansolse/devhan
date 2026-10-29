"use client";

import { useEffect } from "react";
import type { WedflixFilm } from "@/data/wedflix/types";

type FilmModalProps = {
  film: WedflixFilm;
  onClose: () => void;
};

export function FilmModal({ film, onClose }: FilmModalProps) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={film.title}
      className="fixed inset-0 z-[120] flex items-center justify-center bg-[rgba(0,0,0,0.9)] p-4"
    >
      <div className="w-full max-w-4xl overflow-hidden rounded-lg bg-[#181818]">
        <div className="relative aspect-video w-full bg-black">
          <iframe
            src={`https://www.youtube.com/embed/${film.videoId}?autoplay=1&rel=0&modestbranding=1`}
            title={film.title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            referrerPolicy="strict-origin-when-cross-origin"
            allowFullScreen
          />
          <button
            type="button"
            onClick={onClose}
            aria-label="Close film"
            className="absolute right-3 top-3 rounded-full bg-[rgba(20,20,20,0.85)] p-2 text-white transition hover:bg-black"
          >
            <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
              <path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z" />
            </svg>
          </button>
        </div>
        <div className="p-5 sm:p-6">
          <h3 className="text-lg font-semibold text-white sm:text-xl">{film.title}</h3>
          <p className="mt-2 text-sm leading-6 text-white/70">{film.description}</p>
        </div>
      </div>
    </div>
  );
}
