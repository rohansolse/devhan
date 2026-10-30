export type Profile = {
  id: string;
  name: string;
  /** Optimized image used as the profile avatar. */
  image: string;
};

/** One event's photos, shown as a grid and paged through in the lightbox. */
export type PhotoRow = {
  id: string;
  title: string;
  images: string[];
};

/**
 * One chip in the event browser. Usually a single event, but several events
 * share a section when they share a `group` — both haldis, for instance.
 */
export type PhotoSection = {
  id: string;
  title: string;
  rows: PhotoRow[];
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
  /**
   * Events sharing a group become one chip in the event browser, each keeping
   * its own sub-heading. Unset means the event is its own chip.
   */
  group?: string;
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
  photoSections: PhotoSection[];
};
