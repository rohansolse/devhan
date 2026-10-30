import { buildStory } from "@/data/gallery/buildStory";
import type { StoryConfig } from "@/data/gallery/types";

/**
 * The whole site in one file. Add an event by creating its folder under
 * `source-images/events/`, listing it here, and running `npm run images:optimize`.
 * Folder order prefixes (`01-`) set the order on the page and are stripped from
 * the title, so `03-haldi-rohan` becomes "Haldi Rohan" unless `title` overrides it.
 */
const storyConfig: StoryConfig = {
  brandName: "DEVHAN",
  brideName: "Devyani",
  groomName: "Rohan",
  seriesTitle: "A Love Story in Five Parts",
  tagline:
    "From the first pre-wedding frame to the last vow — turmeric, laughter, two families and one forever.",
  genres: ["Pre-Wedding", "Engagement", "Haldi", "Wedding"],
  // Filename stems, e.g. "_RJL5250" for _RJL5250.jpg. Leave unset and the page
  // picks frames automatically until you choose them.
  billboard: "_MG_2973",
  profiles: [
    { name: "Rohan", frame: "_MG_2712" },
    { name: "Devyani", frame: "_MG_2565" },
    { name: "Family", frame: "_MG_2526" },
    { name: "Friends", frame: "_MG_2489" }
  ],
  // Add YouTube films here once they are up; the row disappears when empty.
  films: [],
  events: [
    { folder: "01-pre-wedding", title: "Pre-Wedding" },
    { folder: "02-engagement", title: "Engagement" },
    // Both haldis share one "Haldi" chip and keep their own sub-chips, in the
    // order listed here — Devyani's is first, so it is the one preselected.
    { folder: "04-haldi-devani", title: "Devyani", group: "Haldi" },
    { folder: "03-haldi-rohan", title: "Rohan", group: "Haldi" },
    { folder: "05-wedding", title: "The Wedding" }
  ]
};

export function getStory() {
  return buildStory(storyConfig);
}
