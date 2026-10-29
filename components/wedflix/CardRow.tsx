"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import type { ReactNode } from "react";

type CardRowProps = {
  id: string;
  title: string;
  children: ReactNode;
};

export function CardRow({ id, title, children }: CardRowProps) {
  const trackRef = useRef<HTMLUListElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const syncArrows = useCallback(() => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    const maxScroll = track.scrollWidth - track.clientWidth;
    setCanScrollLeft(track.scrollLeft > 8);
    setCanScrollRight(track.scrollLeft < maxScroll - 8);
  }, []);

  useEffect(() => {
    syncArrows();
    window.addEventListener("resize", syncArrows);
    return () => window.removeEventListener("resize", syncArrows);
  }, [syncArrows]);

  const scrollByPage = (direction: 1 | -1) => {
    const track = trackRef.current;

    if (!track) {
      return;
    }

    track.scrollBy({ left: direction * track.clientWidth * 0.85, behavior: "smooth" });
  };

  return (
    <section id={id} className="scroll-mt-20 py-5 sm:py-7">
      <h2 className="px-4 text-lg font-semibold text-white sm:px-8 sm:text-2xl lg:px-12">
        {title}
      </h2>

      <div className="group/row relative mt-3">
        <ul
          ref={trackRef}
          onScroll={syncArrows}
          className="flex snap-x snap-mandatory gap-2 overflow-x-auto scroll-smooth px-4 pb-4 sm:gap-3 sm:px-8 lg:px-12 [&::-webkit-scrollbar]:hidden"
        >
          {children}
        </ul>

        {canScrollLeft ? (
          <RowArrow direction="left" onClick={() => scrollByPage(-1)} />
        ) : null}
        {canScrollRight ? (
          <RowArrow direction="right" onClick={() => scrollByPage(1)} />
        ) : null}
      </div>
    </section>
  );
}

function RowArrow({
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
      aria-label={direction === "left" ? "Scroll left" : "Scroll right"}
      className={`absolute top-0 bottom-4 z-10 hidden w-10 items-center justify-center bg-[rgba(20,20,20,0.6)] text-white opacity-0 transition hover:bg-[rgba(20,20,20,0.85)] focus-visible:opacity-100 group-hover/row:opacity-100 sm:flex lg:w-12 ${
        direction === "left" ? "left-0" : "right-0"
      }`}
    >
      <svg viewBox="0 0 24 24" aria-hidden className="h-7 w-7 fill-current">
        {direction === "left" ? (
          <path d="M15.4 7.4L14 6l-6 6 6 6 1.4-1.4-4.6-4.6z" />
        ) : (
          <path d="M8.6 16.6L10 18l6-6-6-6-1.4 1.4 4.6 4.6z" />
        )}
      </svg>
    </button>
  );
}
