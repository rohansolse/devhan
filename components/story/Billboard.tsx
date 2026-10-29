"use client";

import type { Story } from "@/data/gallery/types";
import { StoryImage } from "@/components/story/StoryImage";

type BillboardProps = {
  story: Story;
  /** Omitted when there is no film yet, which hides the Play button. */
  onPlay?: () => void;
  onMoreInfo: () => void;
};

export function Billboard({ story, onPlay, onMoreInfo }: BillboardProps) {
  return (
    <section className="relative min-h-[80vh] w-full sm:min-h-screen">
      {/* No photos on disk yet — the gradients alone carry the hero. */}
      {story.billboardImage ? (
        <StoryImage
          src={story.billboardImage}
          alt={`${story.brideName} and ${story.groomName}`}
          sizes="100vw"
          priority
          className="absolute inset-0 h-full w-full object-cover object-[35%_30%]"
        />
      ) : null}
      <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(0,0,0,0.55)_0%,rgba(0,0,0,0.15)_35%,rgba(20,17,15,0.9)_88%,#14110f_100%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(0,0,0,0.8)_0%,rgba(0,0,0,0.35)_45%,transparent_75%)]" />

      <div className="relative flex min-h-[80vh] flex-col justify-end px-4 pb-16 sm:min-h-screen sm:px-8 sm:pb-24 lg:px-12">
        <div className="max-w-2xl">
          <p className="text-xs uppercase tracking-[0.4em] text-white/70">
            {story.seriesTitle}
          </p>

          <h1 className="font-display mt-4 flex flex-wrap items-baseline gap-x-3 text-4xl font-semibold leading-tight text-white sm:text-7xl sm:leading-none lg:text-8xl">
            <span>{story.brideName}</span>
            <span className="text-xl font-normal tracking-[0.3em] text-accent sm:text-3xl">
              WEDS
            </span>
            <span>{story.groomName}</span>
          </h1>

          <p className="mt-6 text-base font-medium text-white/90 sm:text-lg">
            {story.rank}
          </p>

          <p className="mt-5 max-w-xl text-sm leading-7 text-white/90 sm:text-lg sm:leading-8">
            {story.tagline}
          </p>

          <ul className="mt-5 flex flex-wrap items-center gap-x-3 gap-y-2 text-sm text-white/70">
            {story.genres.map((genre, index) => (
              <li key={genre} className="flex items-center gap-3">
                {index > 0 ? (
                  <span aria-hidden className="text-white/40">
                    •
                  </span>
                ) : null}
                {genre}
              </li>
            ))}
          </ul>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            {onPlay ? (
              <button
                type="button"
                onClick={onPlay}
                className="flex items-center gap-2 rounded bg-white px-6 py-2.5 text-base font-semibold text-black transition hover:bg-white/80 sm:px-8 sm:py-3"
              >
                <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
                  <path d="M6 4.5v15l13-7.5z" />
                </svg>
                Play
              </button>
            ) : null}
            <button
              type="button"
              onClick={onMoreInfo}
              className="flex items-center gap-2 rounded bg-[rgba(109,109,110,0.7)] px-6 py-2.5 text-base font-semibold text-white transition hover:bg-[rgba(109,109,110,0.5)] sm:px-8 sm:py-3"
            >
              <svg viewBox="0 0 24 24" aria-hidden className="h-5 w-5 fill-current">
                <path d="M12 2a10 10 0 100 20 10 10 0 000-20zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
              </svg>
              More Info
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
