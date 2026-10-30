import {
  fromEventFolder,
  isDuplicate,
  slugifyTitle,
  toRowTitle
} from "@/data/gallery/sources";
import type {
  PhotoRow,
  PhotoSection,
  Story,
  StoryConfig
} from "@/data/gallery/types";

const DEFAULT_RANK = "Every event, in the order it happened";

/**
 * Collects the rows into the chips shown by the event browser, keeping the
 * order the events are configured in. Events that share a `group` land in one
 * section and keep their own rows, so "Haldi" holds both haldis.
 */
function toSections(
  events: { group: string; row: PhotoRow }[]
): PhotoSection[] {
  const sections: PhotoSection[] = [];

  for (const { group, row } of events) {
    const id = slugifyTitle(group);
    const existing = sections.find((section) => section.id === id);

    if (existing) {
      existing.rows.push(row);
    } else {
      sections.push({ id, title: group, rows: [row] });
    }
  }

  return sections;
}

/**
 * Reads each event folder once. `sections` drop near-duplicate frames and
 * empty events, while `allFrames` keeps everything on disk, because the
 * billboard and the avatars may point at a frame the rows hide.
 */
function readEvents(config: StoryConfig): {
  sections: PhotoSection[];
  allFrames: string[];
} {
  const events = config.events.map((event) => {
    const title = event.title ?? toRowTitle(event.folder);

    return {
      id: slugifyTitle(event.folder),
      title,
      group: event.group ?? title,
      images: fromEventFolder(event.folder)
    };
  });

  const rows = events
    .map((event) => ({
      ...event,
      images: event.images.filter((image) => !isDuplicate(image))
    }))
    .filter((event) => event.images.length > 0)
    .map(({ group, ...row }) => ({ group, row }));

  return {
    sections: toSections(rows),
    allFrames: events.flatMap((event) => event.images)
  };
}

/**
 * Resolves a hand-picked frame by its filename stem across every row, so the
 * billboard and avatars survive a re-run of the image optimizer. Falls back to
 * a frame from the rows when the stem is unset or no longer on disk, so the
 * page keeps working while photos are still being added.
 */
function makeFramePicker(allImages: string[]) {
  return (stem: string | undefined, fallbackIndex: number) => {
    const picked = stem
      ? allImages.find((imagePath) => imagePath.includes(`/${stem}.`))
      : undefined;

    return picked ?? allImages[fallbackIndex % Math.max(1, allImages.length)] ?? null;
  };
}

export function buildStory(config: StoryConfig): Story {
  const { sections: photoSections, allFrames } = readEvents(config);
  const pickFrame = makeFramePicker(allFrames);

  return {
    brandName: config.brandName,
    brideName: config.brideName,
    groomName: config.groomName,
    seriesTitle: config.seriesTitle,
    rank: config.rank ?? DEFAULT_RANK,
    tagline: config.tagline,
    genres: config.genres,
    billboardImage: pickFrame(config.billboard, 0),
    profiles: config.profiles
      .map((profile, index) => ({
        id: slugifyTitle(profile.name),
        name: profile.name,
        image: pickFrame(profile.frame, index + 1)
      }))
      .filter((profile): profile is { id: string; name: string; image: string } =>
        Boolean(profile.image)
      ),
    filmRows: (config.films ?? []).map((filmRow) => ({
      id: slugifyTitle(filmRow.title),
      title: filmRow.title,
      films: filmRow.items
    })),
    photoSections
  };
}
