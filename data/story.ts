import { buildStory } from "@/data/wedflix/buildStory";
import type { WedflixStoryConfig } from "@/data/wedflix/types";

/**
 * The whole site in one file. Add an event by creating its folder under
 * `source-images/events/`, listing it here, and running `npm run images:optimize`.
 * Folder order prefixes (`01-`) set the order on the page and are stripped from
 * the title, so `03-haldi-rohan` becomes "Haldi Rohan" unless `title` overrides it.
 */
const storyConfig: WedflixStoryConfig = {
  brandName: "DEVHAN",
  brideName: "Devani",
  groomName: "Rohan",
  seriesTitle: "A Love Story in Five Parts",
  tagline:
    "From the first pre-wedding frame to the last vow — turmeric, laughter, two families and one forever.",
  genres: ["Romance", "Celebration", "Family"],
  // Filename stems, e.g. "_RJL5250" for _RJL5250.jpg. Leave unset and the page
  // picks frames automatically until you choose them.
  billboard: undefined,
  profiles: [
    { name: "Rohan" },
    { name: "Devani" },
    { name: "Family" },
    { name: "Friends" }
  ],
  // Add YouTube films here once they are up; the row disappears when empty.
  films: [],
  events: [
    { folder: "01-pre-wedding", title: "Pre-Wedding" },
    { folder: "02-engagement", title: "Engagement" },
    { folder: "03-haldi-rohan", title: "Haldi — Rohan" },
    { folder: "04-haldi-devani", title: "Haldi — Devani" },
    { folder: "05-wedding", title: "The Wedding" }
  ]
};

export function getStory() {
  return buildStory(storyConfig);
}
