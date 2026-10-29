"use client";

import { useCallback, useEffect } from "react";
import { StoryImage } from "@/components/story/StoryImage";

type PhotoLightboxProps = {
  title: string;
  images: string[];
  index: number;
  onIndexChange: (index: number) => void;
  onClose: () => void;
};

export function PhotoLightbox({
  title,
  images,
  index,
  onIndexChange,
  onClose
}: PhotoLightboxProps) {
  const step = useCallback(
    (direction: 1 | -1) => {
      onIndexChange((index + direction + images.length) % images.length);
    },
    [index, images.length, onIndexChange]
  );

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      } else if (event.key === "ArrowRight") {
        step(1);
      } else if (event.key === "ArrowLeft") {
        step(-1);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onClose, step]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-[120] flex flex-col bg-black"
    >
      <div className="flex items-center justify-between px-4 py-3 text-white sm:px-8">
        <div>
          <p className="text-sm font-semibold sm:text-base">{title}</p>
          <p className="text-xs text-white/60">
            {index + 1} / {images.length}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close gallery"
          className="rounded-full p-2 transition hover:bg-white/10"
        >
          <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-current">
            <path d="M18.3 5.7L12 12l6.3 6.3-1.4 1.4L10.6 13.4 4.3 19.7 2.9 18.3 9.2 12 2.9 5.7l1.4-1.4 6.3 6.3 6.3-6.3z" />
          </svg>
        </button>
      </div>

      <div className="relative flex min-h-0 flex-1 items-center justify-center px-4 pb-6 sm:px-16">
        <StoryImage
          key={images[index]}
          src={images[index]}
          alt={`${title} — photo ${index + 1}`}
          sizes="100vw"
          priority
          className="max-h-full max-w-full object-contain"
        />

        <LightboxArrow direction="left" onClick={() => step(-1)} />
        <LightboxArrow direction="right" onClick={() => step(1)} />
      </div>
    </div>
  );
}

function LightboxArrow({
  direction,
  onClick
}: {
  direction: "left" | "right";
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={direction === "left" ? "Previous photo" : "Next photo"}
      className={`absolute top-1/2 -translate-y-1/2 rounded-full bg-[rgba(20,20,20,0.7)] p-2 text-white transition hover:bg-[rgba(20,20,20,0.95)] sm:p-3 ${
        direction === "left" ? "left-2 sm:left-6" : "right-2 sm:right-6"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-6 w-6 fill-current sm:h-8 sm:w-8">
        {direction === "left" ? (
          <path d="M15.4 7.4L14 6l-6 6 6 6 1.4-1.4-4.6-4.6z" />
        ) : (
          <path d="M8.6 16.6L10 18l6-6-6-6-1.4 1.4 4.6 4.6z" />
        )}
      </svg>
    </button>
  );
}
