"use client";

import { useEffect, useState } from "react";

type WedflixIntroProps = {
  /** Wordmark that fades in — the couple's name, e.g. "DEVHAN". */
  brandName: string;
  /** Fired once the title card has played (or was skipped). */
  onFinish: () => void;
};

// Title-card timings (ms). `DUR` drives the CSS via the --wf-dur var.
const DUR = 2200;
const LEAVE_AT = 1800;
const FINISH_AT = 2200;

export function WedflixIntro({ brandName, onFinish }: WedflixIntroProps) {
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
      className={`fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-[#14110f] transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      style={{ ["--wf-dur" as string]: `${DUR}ms` }}
      aria-hidden
    >
      <span className="wf-intro-word font-display uppercase text-[#d4a24c]">
        {brandName}
      </span>

      <style>{`
        .wf-intro-word {
          position: relative;
          font-size: clamp(2.5rem, 14vw, 7.5rem);
          line-height: 1;
          opacity: 0;
          letter-spacing: 0.4em;
          animation: wf-intro-settle var(--wf-dur) ease-out forwards;
        }

        @keyframes wf-intro-settle {
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
          .wf-intro-word {
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
