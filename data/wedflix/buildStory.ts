import { fromEventFolder, slugifyTitle, toRowTitle } from "@/data/wedflix/sources";
import type {
  WedflixPhotoCard,
  WedflixPhotoRow,
  WedflixStory,
  WedflixStoryConfig
} from "@/data/wedflix/types";

const MAX_ROW_CARDS = 14;
const DEFAULT_RANK = "#1 in Love Stories Today";

/**
 * Spreads the row cards evenly across the collection so the strip previews the
 * whole event instead of only its opening frames.
 */
function toRowCards(rowId: string, images: string[]): WedflixPhotoCard[] {
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

/** Events with no optimized photos yet are left off the page entirely. */
function buildRows(config: WedflixStoryConfig): WedflixPhotoRow[] {
  return config.events
    .map((event) => {
      const title = event.title ?? toRowTitle(event.folder);
      const id = slugifyTitle(event.folder);

      return { id, title, images: fromEventFolder(event.folder) };
    })
    .filter((row) => row.images.length > 0)
    .map((row) => ({ ...row, cards: toRowCards(row.id, row.images) }));
}

/**
 * Resolves a hand-picked frame by its filename stem across every row, so the
 * billboard and avatars survive a re-run of the image optimizer. Falls back to
 * a frame from the rows when the stem is unset or no longer on disk, so the
 * page keeps working while photos are still being added.
 */
function makeFramePicker(rows: WedflixPhotoRow[]) {
  const allImages = rows.flatMap((row) => row.images);

  return (stem: string | undefined, fallbackIndex: number) => {
    const picked = stem
      ? allImages.find((imagePath) => imagePath.includes(`/${stem}.`))
      : undefined;

    return picked ?? allImages[fallbackIndex % Math.max(1, allImages.length)] ?? null;
  };
}

export function buildStory(config: WedflixStoryConfig): WedflixStory {
  const photoRows = buildRows(config);
  const pickFrame = makeFramePicker(photoRows);

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
