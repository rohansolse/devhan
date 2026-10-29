import {
  fromEventFolder,
  isDuplicate,
  slugifyTitle,
  toRowTitle
} from "@/data/gallery/sources";
import type {
  PhotoCard,
  PhotoRow,
  Story,
  StoryConfig
} from "@/data/gallery/types";

const MAX_ROW_CARDS = 14;
const DEFAULT_RANK = "Every event, in the order it happened";

/**
 * Spreads the row cards evenly across the collection so the strip previews the
 * whole event instead of only its opening frames.
 */
function toRowCards(rowId: string, images: string[]): PhotoCard[] {
  const step = Math.max(1, Math.ceil(images.length / MAX_ROW_CARDS));

  return images
    .map((image, index) => ({ image, index }))
    .filter(({ index }) => index % step === 0)
    .slice(0, MAX_ROW_CARDS)
    .map(({ image, index }, position) => ({
      id: `${rowId}-${position}`,
      title: `Frame ${position + 1}`,
      image,
      index
    }));
}

/**
 * Reads each event folder once. `rows` drop near-duplicate frames and empty
 * events, while `allFrames` keeps everything on disk, because the billboard
 * and the avatars may point at a frame the rows hide.
 */
function readEvents(config: StoryConfig): {
  rows: PhotoRow[];
  allFrames: string[];
} {
  const events = config.events.map((event) => ({
    id: slugifyTitle(event.folder),
    title: event.title ?? toRowTitle(event.folder),
    images: fromEventFolder(event.folder)
  }));

  const rows = events
    .map((event) => ({
      ...event,
      images: event.images.filter((image) => !isDuplicate(image))
    }))
    .filter((row) => row.images.length > 0)
    .map((row) => ({ ...row, cards: toRowCards(row.id, row.images) }));

  return { rows, allFrames: events.flatMap((event) => event.images) };
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
  const { rows: photoRows, allFrames } = readEvents(config);
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
    photoRows
  };
}
