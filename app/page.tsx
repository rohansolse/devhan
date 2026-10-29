import type { Metadata } from "next";
import { StoryExperience } from "@/components/story/StoryExperience";
import { getStory } from "@/data/story";

const story = getStory();

export const metadata: Metadata = {
  title: { absolute: `${story.brideName} & ${story.groomName} | ${story.brandName}` },
  description: story.tagline,
  // A private family page — keep it out of search results.
  robots: { index: false, follow: false }
};

export default function HomePage() {
  return <StoryExperience story={story} />;
}
