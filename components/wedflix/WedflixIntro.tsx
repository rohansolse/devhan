"use client";

import { useEffect, useRef, useState } from "react";

type WedflixIntroProps = {
  /** Wordmark that sweeps in — the couple's brand, e.g. "DEVHAN". */
  brandName: string;
  /** Fired once the ident has fully played (or was skipped). */
  onFinish: () => void;
};

// Opening ident timings (ms). `DUR` drives the CSS via the --wf-dur var;
// `FLASH_AT` is when the synthesized "ta-dum" sting fires.
const DUR = 3000;
const FLASH_AT = 1000;
const LEAVE_AT = 2500;
const FINISH_AT = 3000;

function playTudum(ctx: AudioContext) {
  const master = ctx.createGain();
  master.gain.value = 0.9;
  master.connect(ctx.destination);

  const note = (freq: number, start: number, dur: number, peak: number) => {
    const osc = ctx.createOscillator();
    const sub = ctx.createOscillator();
    const gain = ctx.createGain();
    const filter = ctx.createBiquadFilter();

    osc.type = "triangle";
    sub.type = "sine";
    osc.frequency.value = freq;
    sub.frequency.value = freq / 2;

    filter.type = "lowpass";
    filter.frequency.value = 1500;

    gain.gain.setValueAtTime(0.0001, start);
    gain.gain.exponentialRampToValueAtTime(peak, start + 0.03);
    gain.gain.exponentialRampToValueAtTime(0.0001, start + dur);

    osc.connect(gain);
    sub.connect(gain);
    gain.connect(filter);
    filter.connect(master);

    osc.start(start);
    sub.start(start);
    osc.stop(start + dur + 0.05);
    sub.stop(start + dur + 0.05);
  };

  const now = ctx.currentTime;
  note(146.83, now, 0.18, 0.5); // "ta" — short D3
  note(73.42, now + 0.16, 0.95, 0.9); // "dum" — long, louder D2
}

export function WedflixIntro({ brandName, onFinish }: WedflixIntroProps) {
  const [leaving, setLeaving] = useState(false);
  const soundedRef = useRef(false);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    if (reduceMotion) {
      onFinish();
      return;
    }

    // Fire the sting once, whether triggered by the timed flash or by the
    // first user gesture (browsers block autoplay audio until a gesture).
    const fireSound = () => {
      if (soundedRef.current) {
        return;
      }

      const AudioCtor =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext;

      if (!AudioCtor) {
        return;
      }

      const ctx = ctxRef.current ?? new AudioCtor();
      ctxRef.current = ctx;

      const start = () => {
        if (soundedRef.current || ctx.state !== "running") {
          return;
        }
        soundedRef.current = true;
        playTudum(ctx);
      };

      if (ctx.state === "suspended") {
        // resume() stays pending until a user gesture; a gesture listener
        // retries this path, so swallow the rejection rather than leak it.
        ctx.resume().then(start, () => {});
      } else {
        start();
      }
    };

    const onGesture = () => fireSound();
    window.addEventListener("pointerdown", onGesture);
    window.addEventListener("keydown", onGesture);
    window.addEventListener("touchstart", onGesture);

    const flashTimer = window.setTimeout(fireSound, FLASH_AT);
    const leaveTimer = window.setTimeout(() => setLeaving(true), LEAVE_AT);
    const finishTimer = window.setTimeout(onFinish, FINISH_AT);

    return () => {
      window.clearTimeout(flashTimer);
      window.clearTimeout(leaveTimer);
      window.clearTimeout(finishTimer);
      window.removeEventListener("pointerdown", onGesture);
      window.removeEventListener("keydown", onGesture);
      window.removeEventListener("touchstart", onGesture);
      // Drop the ref too: a reused closed context would never resume, and the
      // sting would silently never play after an effect re-run.
      void ctxRef.current?.close();
      ctxRef.current = null;
    };
  }, [onFinish]);

  return (
    <div
      className={`fixed inset-0 z-[120] flex items-center justify-center overflow-hidden bg-black transition-opacity duration-500 ${
        leaving ? "opacity-0" : "opacity-100"
      }`}
      style={{ ["--wf-dur" as string]: `${DUR}ms` }}
      aria-hidden
    >
      <span className="wf-intro-word font-extrabold uppercase tracking-tight text-[#e50914]">
        {brandName}
      </span>

      {/* Full-screen white flash that lands with the sting. */}
      <div className="wf-intro-flash" />

      <style>{`
        .wf-intro-flash {
          position: absolute;
          inset: 0;
          background: #ffffff;
          opacity: 0;
          animation: wf-flash var(--wf-dur) ease-out forwards;
        }

        @keyframes wf-flash {
          0%, 30% { opacity: 0; }
          33% { opacity: 0.85; }
          42% { opacity: 0; }
          100% { opacity: 0; }
        }

        .wf-intro-word {
          position: relative;
          font-size: clamp(2.75rem, 16vw, 9rem);
          line-height: 1;
          opacity: 0;
          transform: scale(1.12);
          letter-spacing: 0.3em;
          animation: wf-intro-sweep var(--wf-dur) ease-out forwards;
        }

        @keyframes wf-intro-sweep {
          0% {
            opacity: 0;
            transform: scale(1.12);
            letter-spacing: 0.3em;
          }
          /* holds dim during the buildup to the flash */
          28% {
            opacity: 0.16;
            transform: scale(1.1);
            letter-spacing: 0.25em;
          }
          /* punches in with the flash + sting at ~1s */
          34% {
            opacity: 1;
            transform: scale(1.04);
            letter-spacing: 0.06em;
            filter: drop-shadow(0 0 42px rgba(255, 255, 255, 0.9))
              drop-shadow(0 0 18px rgba(229, 9, 20, 0.85));
          }
          55% {
            opacity: 1;
            transform: scale(1);
            letter-spacing: 0em;
            filter: drop-shadow(0 0 14px rgba(229, 9, 20, 0.45));
          }
          100% {
            opacity: 1;
            transform: scale(1);
            filter: drop-shadow(0 0 10px rgba(229, 9, 20, 0.3));
          }
        }

        @media (prefers-reduced-motion: reduce) {
          .wf-intro-flash {
            animation: none;
            opacity: 0;
          }
          .wf-intro-word {
            animation: none;
            opacity: 1;
            transform: none;
            letter-spacing: 0;
          }
        }
      `}</style>
    </div>
  );
}
