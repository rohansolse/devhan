"use client";

import { toImageSrc, toResponsiveSrcSet } from "@/data/responsiveImages";

type StoryImageProps = {
  src: string;
  alt: string;
  sizes: string;
  className?: string;
  priority?: boolean;
};

export function StoryImage({
  src,
  alt,
  sizes,
  className = "",
  priority = false
}: StoryImageProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- static export ships plain <img> with hand-built srcsets
    <img
      src={toImageSrc(src)}
      srcSet={toResponsiveSrcSet(src)}
      sizes={sizes}
      alt={alt}
      loading={priority ? "eager" : "lazy"}
      decoding={priority ? "sync" : "async"}
      fetchPriority={priority ? "high" : "auto"}
      className={className}
    />
  );
}
