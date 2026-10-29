"use client";

import { useEffect, useState } from "react";

type TitleCardProps = {
  /** Wordmark that fades in — the couple's name, e.g. "DEVHAN". */
  brandName: string;
  /** Fired once the title card has played (or was skipped). */
  onFinish: () => void;
};

// Title-card timings (ms). `DUR` drives the CSS via the --title-dur var.
const DUR = 2200;
const LEAVE_AT = 1800;
const FINISH_AT = 2200;

export function TitleCard({ brandName, onFinish }: TitleCardProps) {
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      onFinish();
      return;
    }

    const leaveTimer = window.setTimeout(() => setLeaving(true), LEAVE_AT);
    const finishTimer = window.setTimeout(onFinish, FINISH_AT);

    return () => {
      window.clearTimeout(leaveTimer);
      window.clearTimeout(finishTimer);
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-shell transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      style={{ ["--title-dur" as string]: `${DUR}ms` }}
      aria-hidden
    >
      <span className="title-word font-display uppercase text-accent">
        {brandName}
      </span>

      <style>{`
        .title-word {
          position: relative;
          font-size: clamp(2.5rem, 14vw, 7.5rem);
          line-height: 1;
          opacity: 0;
          letter-spacing: 0.4em;
          animation: title-settle var(--title-dur) ease-out forwards;
        }

        @keyframes title-settle {
          0% {
            opacity: 0;
            letter-spacing: 0.4em;
            transform: scale(1.04);
          }
          60% {
            opacity: 1;
            letter-spacing: 0.18em;
            transform: scale(1);
          }
          100% {
            opacity: 1;
            letter-spacing: 0.18em;
            transform: scale(1);
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .title-word {
            animation: none;
            opacity: 1;
            letter-spacing: 0.18em;
            transform: none;
          }
        }
      `}</style>
    </div>
  );
}
