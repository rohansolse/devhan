export type Profile = {
  id: string;
  name: string;
  /** Optimized image used as the profile avatar. */
  image: string;
};

export type PhotoCard = {
  id: string;
  title: string;
  image: string;
  /** Position of this frame within the row's full `images` list. */
  index: number;
};

export type PhotoRow = {
  id: string;
  title: string;
  /** Every image in the collection, used by the lightbox. */
  images: string[];
  cards: PhotoCard[];
};

export type Film = {
  id: string;
  title: string;
  videoId: string;
  description: string;
};

export type FilmRow = {
  id: string;
  title: string;
  films: Film[];
};

/** One event row. Images come from `source-images/events/<folder>/`. */
export type EventConfig = {
  /** Folder name under source-images/events, ordering prefix included. */
  folder: string;
  /** Overrides the title derived from the folder name. */
  title?: string;
};

export type FilmConfig = {
  id: string;
  title: string;
  videoId: string;
  description: string;
};

/**
 * Everything about this wedding. `buildStory` turns it into the `Story`
 * the page renders.
 */
export type StoryConfig = {
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
  films?: { title: string; items: FilmConfig[] }[];
  events: EventConfig[];
};

export type Story = {
  brandName: string;
  brideName: string;
  groomName: string;
  seriesTitle: string;
  rank: string;
  tagline: string;
  genres: string[];
  /** Null until at least one event folder has optimized images. */
  billboardImage: string | null;
  profiles: Profile[];
  filmRows: FilmRow[];
  photoRows: PhotoRow[];
};
