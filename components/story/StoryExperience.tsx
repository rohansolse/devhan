"use client";

import { useEffect, useState } from "react";
import type {
  Film,
  PhotoRow,
  Profile,
  Story
} from "@/data/gallery/types";
import { Billboard } from "@/components/story/Billboard";
import { CardRow } from "@/components/story/CardRow";
import { FilmModal } from "@/components/story/FilmModal";
import { PhotoLightbox } from "@/components/story/PhotoLightbox";
import { ProfileGate } from "@/components/story/ProfileGate";
import { StoryImage } from "@/components/story/StoryImage";
import { TitleCard } from "@/components/story/TitleCard";
import { StoryNav } from "@/components/story/StoryNav";

const CARD_SIZES = "(max-width: 640px) 60vw, (max-width: 1024px) 32vw, 20vw";

type LightboxState = {
  row: PhotoRow;
  index: number;
};

type StoryExperienceProps = {
  story: Story;
};

export function StoryExperience({ story }: StoryExperienceProps) {
  const [introDone, setIntroDone] = useState(false);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [activeFilm, setActiveFilm] = useState<Film | null>(null);
  const [lightbox, setLightbox] = useState<LightboxState | null>(null);

  const firstFilm = story.filmRows[0]?.films[0] ?? null;
  // The gate only makes sense once there are avatars to show, which needs photos.
  const gateOpen = story.profiles.length > 0 && !profile;
  const isOverlayOpen =
    !introDone || gateOpen || Boolean(activeFilm) || Boolean(lightbox);

  useEffect(() => {
    if (!isOverlayOpen) {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isOverlayOpen]);

  const rowLinks = [
    ...story.filmRows.map((row) => ({ id: row.id, title: row.title })),
    ...story.photoRows.map((row) => ({ id: row.id, title: row.title }))
  ];

  return (
    <div id="top" className="min-h-screen overflow-x-hidden bg-shell text-white">
      {/* Overlays sit outside this wrapper, so `inert` keeps focus from tabbing
          behind the profile gate, the film modal, or the lightbox. */}
      <div inert={isOverlayOpen}>
        <StoryNav
          brandName={story.brandName}
          rowLinks={rowLinks}
          profile={profile}
          onSwitchProfile={() => setProfile(null)}
        />

        <main>
          <Billboard
            story={story}
            onPlay={firstFilm ? () => setActiveFilm(firstFilm) : undefined}
            onMoreInfo={() => {
              document
                .getElementById(story.photoRows[0]?.id ?? "")
                ?.scrollIntoView({ behavior: "smooth" });
            }}
          />

          <div className="relative z-10 -mt-6 pb-16 sm:-mt-10">
            {story.filmRows.map((row) => (
              <CardRow key={row.id} id={row.id} title={row.title}>
                {row.films.map((film) => (
                  <li
                    key={film.id}
                    className="w-[60vw] shrink-0 snap-start sm:w-[32vw] lg:w-[20vw]"
                  >
                    <button
                      type="button"
                      onClick={() => setActiveFilm(film)}
                      className="group block w-full text-left"
                    >
                      <span className="relative block overflow-hidden rounded transition duration-300 group-hover:scale-105 group-focus-visible:scale-105">
                        <StoryImage
                          src={`https://i.ytimg.com/vi/${film.videoId}/hqdefault.jpg`}
                          alt={film.title}
                          sizes={CARD_SIZES}
                          className="aspect-video w-full object-cover"
                        />
                        <span className="absolute inset-0 flex items-center justify-center bg-[rgba(0,0,0,0.25)] opacity-0 transition group-hover:opacity-100 group-focus-visible:opacity-100">
                          <svg
                            viewBox="0 0 24 24"
                            aria-hidden
                            className="h-12 w-12 fill-white drop-shadow"
                          >
                            <path d="M6 4.5v15l13-7.5z" />
                          </svg>
                        </span>
                      </span>
                      <span className="mt-2 block text-sm text-white/85">{film.title}</span>
                    </button>
                  </li>
                ))}
              </CardRow>
            ))}

            {story.photoRows.map((row) => (
              <CardRow key={row.id} id={row.id} title={row.title}>
                {row.cards.map((card) => (
                  <li
                    key={card.id}
                    className="w-[60vw] shrink-0 snap-start sm:w-[32vw] lg:w-[20vw]"
                  >
                    <button
                      type="button"
                      onClick={() => setLightbox({ row, index: card.index })}
                      aria-label={`Open ${row.title} gallery at photo ${card.index + 1}`}
                      className="group block w-full overflow-hidden rounded transition duration-300 hover:scale-105 focus-visible:scale-105"
                    >
                      <StoryImage
                        src={card.image}
                        alt={`${row.title} — ${card.title}`}
                        sizes={CARD_SIZES}
                        className="aspect-video w-full object-cover"
                      />
                    </button>
                  </li>
                ))}
              </CardRow>
            ))}

            {/* Before the first shoot is added there is nothing to scroll. */}
            {story.photoRows.length ? null : (
              <p className="px-4 py-16 text-center text-sm text-white/60 sm:px-8">
                Photos are being added — the events will appear here as each
                shoot is edited.
              </p>
            )}
          </div>
        </main>

        <footer className="border-t border-white/10 px-4 py-12 text-center text-sm text-white/50 sm:px-8">
          <p className="font-display text-2xl text-white sm:text-3xl">
            {story.brideName} &amp; {story.groomName}
          </p>
          <p className="mt-3">{story.seriesTitle}</p>
        </footer>
      </div>

      {/* The gate sits behind the intro (lower z-index) so that when the intro
          fades out it reveals the gate — never a flash of the gallery behind. */}
      {gateOpen ? (
        <ProfileGate profiles={story.profiles} onSelect={setProfile} />
      ) : null}

      {introDone ? null : (
        <TitleCard brandName={story.brandName} onFinish={() => setIntroDone(true)} />
      )}

      {activeFilm ? (
        <FilmModal film={activeFilm} onClose={() => setActiveFilm(null)} />
      ) : null}

      {lightbox ? (
        <PhotoLightbox
          title={lightbox.row.title}
          images={lightbox.row.images}
          index={lightbox.index}
          onIndexChange={(index) => setLightbox({ row: lightbox.row, index })}
          onClose={() => setLightbox(null)}
        />
      ) : null}
    </div>
  );
}
