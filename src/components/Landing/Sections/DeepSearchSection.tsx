import Player from "next-video/player";
import { useState } from "react";

import { AiBrowserIcon } from "@/components/Misc/icons";
import { SectionHeading } from "@/layouts/LandingSectionHeading";
import { cn } from "@/lib/utils";

const videos = [
  {
    id: "finance",
    src: "https://res.cloudinary.com/dwhuiazdn/video/upload/v1743186298/deepsearch-finance_zmkqca.mp4",
    // label: "Finance",
    label: "Example 1",
  },
  {
    id: "headphones",
    src: "https://res.cloudinary.com/dwhuiazdn/video/upload/v1743186939/deep-search-headphones-1743186723080_wsslru.mp4",
    // label: "Headphones",
    label: "Example 2",
  },
];

export default function DeepSearchSection() {
  const [activeVideo, setActiveVideo] = useState(videos[0].id);

  return (
    <div className="flex w-screen items-center justify-center">
      <div className="flex w-screen max-w-screen-xl flex-col space-y-5">
        <SectionHeading
          // heading="Automated Web Browsing"
          heading="Go Beyond Google Search"
          chipTitle="Deep Search"
          icon={
            <AiBrowserIcon
              className="size-[35px] sm:size-[35px]"
              color="#9b9b9b"
            />
          }
          subheading="GAIA Deep Search goes beyond traditional search engines. Instead of just giving you links, GAIA scans the web, retrieves full content from multiple sources, and extracts key insights—so you get instant, in-depth answers."
        />

        <div className="flex justify-center">
          <div className="relative w-full max-w-screen-xl">
            {videos.map((video) => (
              <div
                key={video.id}
                className={cn(
                  "absolute inset-0 w-full transition-opacity duration-500",
                  activeVideo === video.id
                    ? "z-10 opacity-100"
                    : "z-0 opacity-0",
                )}
                style={{
                  pointerEvents: activeVideo === video.id ? "auto" : "none",
                }}
              >
                <Player
                  src={video.src}
                  autoPlay={activeVideo === video.id}
                  muted
                  // controls={false}
                  className="w-full rounded-lg shadow-lg"
                />
              </div>
            ))}
            <div className="relative w-full pb-[56.25%]" />
          </div>
        </div>

        <div className="mb-4 flex justify-center gap-1">
          {videos.map((video) => (
            <button
              key={video.id}
              onClick={() => setActiveVideo(video.id)}
              className={cn(
                "rounded-full px-4 py-1 transition-all duration-100",
                activeVideo === video.id
                  ? "bg-primary text-black"
                  : "bg-white/10 text-white/70 hover:bg-white/50 hover:text-white",
              )}
            >
              {video.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
