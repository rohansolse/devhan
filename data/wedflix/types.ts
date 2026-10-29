export type WedflixProfile = {
  id: string;
  name: string;
  /** Optimized image used as the profile avatar. */
  image: string;
};

export type WedflixPhotoCard = {
  id: string;
  title: string;
  image: string;
  /** Position of this frame within the row's full `images` list. */
  index: number;
};

export type WedflixPhotoRow = {
  id: string;
  title: string;
  /** Every image in the collection, used by the lightbox. */
  images: string[];
  cards: WedflixPhotoCard[];
};

export type WedflixFilm = {
  id: string;
  title: string;
  videoId: string;
  description: string;
};

export type WedflixFilmRow = {
  id: string;
  title: string;
  films: WedflixFilm[];
};

/** One event row. Images come from `source-images/events/<folder>/`. */
export type WedflixEventConfig = {
  /** Folder name under source-images/events, ordering prefix included. */
  folder: string;
  /** Overrides the title derived from the folder name. */
  title?: string;
};

export type WedflixFilmConfig = {
  id: string;
  title: string;
  videoId: string;
  description: string;
};

/**
 * Everything about this wedding. `buildStory` turns it into the `WedflixStory`
 * the page renders.
 */
export type WedflixStoryConfig = {
  brandName: string;
  brideName: string;
  groomName: string;
  seriesTitle: string;
  rank?: string;
  tagline: string;
  genres: string[];
  /** Filename stem of the billboard frame; must live in one of the events. */
  billboard?: string;
  /** Profile names mapped to filename stems from any of the events. */
  profiles: { name: string; frame?: string }[];
  films?: { title: string; items: WedflixFilmConfig[] }[];
  events: WedflixEventConfig[];
};

export type WedflixStory = {
  brandName: string;
  brideName: string;
  groomName: string;
  seriesTitle: string;
  rank: string;
  tagline: string;
  genres: string[];
  /** Null until at least one event folder has optimized images. */
  billboardImage: string | null;
  profiles: WedflixProfile[];
  filmRows: WedflixFilmRow[];
  photoRows: WedflixPhotoRow[];
};
