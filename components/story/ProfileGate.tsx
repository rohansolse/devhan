"use client";

import type { Profile } from "@/data/gallery/types";
import { StoryImage } from "@/components/story/StoryImage";

type ProfileGateProps = {
  profiles: Profile[];
  onSelect: (profile: Profile) => void;
};

export function ProfileGate({ profiles, onSelect }: ProfileGateProps) {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-shell px-6">
      <h1 className="text-center text-3xl font-medium text-white sm:text-5xl lg:text-6xl">
        Who&apos;s joining the celebration?
      </h1>

      {/* Centred flex-wrap with widths tuned so four avatars always fit one row
          from sm up — this stays centred for couples with fewer than four. */}
      <ul className="mt-10 flex flex-wrap justify-center gap-5 sm:mt-14 sm:gap-4 lg:gap-8">
        {profiles.map((profile) => (
          <li key={profile.id}>
            <button
              type="button"
              onClick={() => onSelect(profile)}
              className="group flex w-[8.5rem] flex-col items-center gap-3 sm:w-[7.5rem] lg:w-40"
            >
              <span className="block w-full overflow-hidden rounded-md border-2 border-transparent transition group-hover:border-white group-focus-visible:border-white">
                <StoryImage
                  src={profile.image}
                  alt=""
                  sizes="(max-width: 640px) 8.5rem, (max-width: 1024px) 7.5rem, 10rem"
                  className="aspect-square w-full object-cover"
                />
              </span>
              <span className="text-sm text-[#808080] transition group-hover:text-white group-focus-visible:text-white sm:text-lg">
                {profile.name}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
