"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import type { WedflixProfile } from "@/data/wedflix/types";
import { WedflixImage } from "@/components/wedflix/WedflixImage";

type WedflixNavProps = {
  brandName: string;
  rowLinks: { id: string; title: string }[];
  profile: WedflixProfile | null;
  onSwitchProfile: () => void;
};

export function WedflixNav({
  brandName,
  rowLinks,
  profile,
  onSwitchProfile
}: WedflixNavProps) {
  const [isScrolled, setIsScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 40);

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${
        isScrolled
          ? "bg-[#14110f]"
          : "bg-[linear-gradient(180deg,rgba(0,0,0,0.75)_0%,transparent_100%)]"
      }`}
    >
      <div className="flex items-center gap-4 px-4 py-3 sm:gap-8 sm:px-8 lg:px-12">
        <Link
          href="#top"
          className="text-xl font-extrabold uppercase tracking-tight text-[#d4a24c] sm:text-2xl"
        >
          {brandName}
        </Link>

        {/* The event links only fit alongside the logo and profile from lg up;
            below that the rows are still reachable by scrolling. */}
        <nav className="hidden min-w-0 flex-1 lg:block">
          <ul className="flex min-w-0 items-center gap-4 overflow-x-auto text-sm text-white/85 sm:gap-6 [&::-webkit-scrollbar]:hidden">
            {rowLinks.map((row) => (
              <li key={row.id}>
                <a
                  href={`#${row.id}`}
                  className="whitespace-nowrap transition hover:text-white/60"
                >
                  {row.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>

        {profile ? (
          <button
            type="button"
            onClick={onSwitchProfile}
            className="ml-auto flex shrink-0 items-center gap-2 text-sm text-white"
            aria-label="Switch profile"
          >
            <WedflixImage
              src={profile.image}
              alt=""
              sizes="2rem"
              className="h-8 w-8 rounded object-cover"
            />
            <span className="hidden sm:inline">{profile.name}</span>
          </button>
        ) : null}
      </div>
    </header>
  );
}
