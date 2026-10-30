"use client";

import { useRef, useState } from "react";
import type { KeyboardEvent } from "react";
import type { PhotoRow, PhotoSection } from "@/data/gallery/types";
import { StoryImage } from "@/components/story/StoryImage";

const GRID_SIZES = "(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw";
/**
 * An event can run past five hundred frames, so the grid starts short and
 * grows on request rather than putting every <img> in the document at once.
 */
const PAGE_SIZE = 48;
/** Scroll target for the nav links and the billboard's "More info". */
export const EVENT_BROWSER_ID = "events";

type EventBrowserProps = {
  sections: PhotoSection[];
  /** Controlled by the page so the nav can jump straight to an event. */
  activeId: string;
  onActiveIdChange: (id: string) => void;
  onOpenPhoto: (row: PhotoRow, index: number, title: string) => void;
};

export function EventBrowser({
  sections,
  activeId,
  onActiveIdChange,
  onOpenPhoto
}: EventBrowserProps) {
  // An unknown id (an old link, an event not shot yet) falls back to the first
  // section rather than rendering an empty page.
  const active =
    sections.find((section) => section.id === activeId) ?? sections[0] ?? null;

  if (!active) {
    return null;
  }

  return (
    <section
      id={EVENT_BROWSER_ID}
      className="scroll-mt-20 px-4 py-6 sm:px-8 sm:py-8 lg:px-12"
    >
      <h2 className="text-lg font-semibold text-white sm:text-2xl">
        What do you want to see?
      </h2>

      <ChipTabs
        label="Events"
        idPrefix="event"
        items={sections}
        activeId={active.id}
        onSelect={onActiveIdChange}
        className="mt-4"
      />

      {/* Keyed on the section so the chosen sub-event and the "show more"
          counts start fresh whenever a different event is chosen. */}
      <SectionPanel
        key={active.id}
        section={active}
        onOpenPhoto={onOpenPhoto}
      />
    </section>
  );
}

/**
 * A section built from several events ("Haldi" holds Rohan's and Devyani's)
 * gets its own second row of chips, so one grid shows at a time and it is
 * always named whose haldi is on screen.
 */
function SectionPanel({
  section,
  onOpenPhoto
}: {
  section: PhotoSection;
  onOpenPhoto: (row: PhotoRow, index: number, title: string) => void;
}) {
  const [activeRowId, setActiveRowId] = useState(section.rows[0]?.id ?? "");
  const hasParts = section.rows.length > 1;
  const activeRow =
    section.rows.find((row) => row.id === activeRowId) ?? section.rows[0];

  if (!activeRow) {
    return null;
  }

  return (
    <div
      role="tabpanel"
      id={`event-panel-${section.id}`}
      aria-labelledby={`event-chip-${section.id}`}
      tabIndex={-1}
      className="mt-6"
    >
      {hasParts ? (
        <>
          <p className="text-sm text-white/60">
            Which {section.title.toLowerCase()}?
          </p>
          <ChipTabs
            label={`${section.title} parts`}
            idPrefix="part"
            items={section.rows}
            activeId={activeRow.id}
            onSelect={setActiveRowId}
            className="mt-2"
            size="small"
          />
        </>
      ) : null}

      <PhotoGrid
        key={activeRow.id}
        row={activeRow}
        title={hasParts ? `${section.title} — ${activeRow.title}` : activeRow.title}
        onOpenPhoto={onOpenPhoto}
      />
    </div>
  );
}

/**
 * A roving-tabindex tab strip: one stop in the tab order, arrow keys move
 * between the chips, which is what `role="tablist"` promises a screen reader.
 */
function ChipTabs({
  label,
  idPrefix,
  items,
  activeId,
  onSelect,
  className = "",
  size = "normal"
}: {
  label: string;
  idPrefix: string;
  items: { id: string; title: string }[];
  activeId: string;
  onSelect: (id: string) => void;
  className?: string;
  size?: "normal" | "small";
}) {
  const stripRef = useRef<HTMLDivElement>(null);

  const moveTo = (index: number) => {
    const target = items[(index + items.length) % items.length];

    if (!target) {
      return;
    }

    onSelect(target.id);
    stripRef.current
      ?.querySelector<HTMLButtonElement>(`#${idPrefix}-chip-${target.id}`)
      ?.focus();
  };

  const handleKeyDown = (event: KeyboardEvent, index: number) => {
    const step =
      event.key === "ArrowRight" ? 1 : event.key === "ArrowLeft" ? -1 : 0;

    if (step) {
      event.preventDefault();
      moveTo(index + step);
      return;
    }

    if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      moveTo(event.key === "Home" ? 0 : items.length - 1);
    }
  };

  return (
    <div
      ref={stripRef}
      role="tablist"
      aria-label={label}
      className={`flex gap-2 overflow-x-auto pb-1 sm:gap-3 [&::-webkit-scrollbar]:hidden ${className}`}
    >
      {items.map((item, index) => {
        const isActive = item.id === activeId;

        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            id={`${idPrefix}-chip-${item.id}`}
            aria-selected={isActive}
            aria-controls={
              idPrefix === "event" ? `event-panel-${item.id}` : undefined
            }
            tabIndex={isActive ? 0 : -1}
            onClick={() => onSelect(item.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={`shrink-0 rounded-full border transition ${
              size === "small"
                ? "px-3 py-1.5 text-xs sm:text-sm"
                : "px-4 py-2 text-sm sm:text-base"
            } ${
              isActive
                ? "border-white bg-white font-semibold text-shell"
                : "border-white/25 text-white/80 hover:border-white/60 hover:text-white"
            }`}
          >
            {item.title}
          </button>
        );
      })}
    </div>
  );
}

function PhotoGrid({
  row,
  title,
  onOpenPhoto
}: {
  row: PhotoRow;
  /** "Haldi — Rohan" for a grouped event, the event's own name otherwise. */
  title: string;
  onOpenPhoto: (row: PhotoRow, index: number, title: string) => void;
}) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const visible = row.images.slice(0, visibleCount);
  const remaining = row.images.length - visible.length;

  return (
    <div className="pt-5 pb-8">
      <h3 className="mb-3 text-base font-semibold text-white/90 sm:text-lg">
        {title}
        <span className="ml-2 text-sm font-normal text-white/50">
          {row.images.length} photos
        </span>
      </h3>

      <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3 lg:grid-cols-4 xl:grid-cols-5">
        {visible.map((image, index) => (
          <li key={image}>
            <button
              type="button"
              onClick={() => onOpenPhoto(row, index, title)}
              aria-label={`Open ${title} gallery at photo ${index + 1}`}
              className="block w-full overflow-hidden rounded transition duration-300 hover:scale-105 focus-visible:scale-105"
            >
              <StoryImage
                src={image}
                alt={`${title} — photo ${index + 1}`}
                sizes={GRID_SIZES}
                className="aspect-square w-full object-cover"
              />
            </button>
          </li>
        ))}
      </ul>

      {remaining > 0 ? (
        <div className="mt-5 text-center">
          <button
            type="button"
            onClick={() => setVisibleCount((count) => count + PAGE_SIZE)}
            className="rounded-full border border-white/30 px-5 py-2 text-sm text-white transition hover:border-white hover:bg-white hover:text-shell"
          >
            Show {Math.min(remaining, PAGE_SIZE)} more
            <span className="ml-2 opacity-60">({remaining} left)</span>
          </button>
        </div>
      ) : null}
    </div>
  );
}
