import {
  Image02Icon,
  InternetIcon,
  NewsIcon,
  Video01Icon,
} from "@/components/Misc/icons";
import {
  ImageResult,
  NewsResult,
  SearchResults,
  VideoResult,
  WebResult,
} from "@/types/convoTypes";
import { Accordion, AccordionItem, Tab, Tabs } from "@heroui/react";
import { formatDistanceToNow } from "date-fns";
import { Play } from "lucide-react";
import Image from "next/image";
import { useState } from "react";

interface SearchResultsTabsProps {
  search_results: SearchResults;
}

export default function SearchResultsTabs({
  search_results,
}: SearchResultsTabsProps) {
  const [isExpanded, setIsExpanded] = useState(true);

  return (
    <div className="w-full pb-4">
      <Accordion
        className="w-full max-w-screen-sm px-0"
        defaultExpandedKeys={["1"]}
      >
        <AccordionItem
          key="1"
          aria-label="Search Results"
          title={
            <div className="text-sm font-medium">
              {isExpanded ? "Hide Search Results" : "Show Search Results"}
            </div>
          }
          onPress={() => setIsExpanded(!isExpanded)}
          className="w-screen max-w-screen-sm px-0"
          isCompact
        >
          <Tabs
            aria-label="Search Results"
            color="primary"
            variant="underlined"
            className="w-screen max-w-screen-sm"
          >
            {search_results.images && search_results.images?.length > 0 && (
              <Tab
                key="images"
                title={
                  <div className="flex items-center space-x-2">
                    <Image02Icon color={undefined} />
                    <span>Images</span>
                  </div>
                }
              >
                <ImageResults images={search_results.images} />
              </Tab>
            )}

            {search_results.web && search_results.web?.length > 0 && (
              <Tab
                key="web"
                title={
                  <div className="flex items-center space-x-2">
                    <InternetIcon color={undefined} />
                    <span>Web</span>
                  </div>
                }
              >
                <WebResults web={search_results.web} />
              </Tab>
            )}

            {search_results.news && search_results.news?.length > 0 && (
              <Tab
                key="news"
                title={
                  <div className="flex items-center space-x-2">
                    <NewsIcon color={undefined} />
                    <span>News</span>
                  </div>
                }
              >
                <NewsResults news={search_results.news} />
              </Tab>
            )}

            {search_results.videos && search_results.videos?.length > 0 && (
              <Tab
                key="videos"
                title={
                  <div className="flex items-center space-x-2">
                    <Video01Icon color={undefined} />
                    <span>Videos</span>
                  </div>
                }
              >
                <VideoResults videos={search_results.videos} />
              </Tab>
            )}
          </Tabs>
        </AccordionItem>
      </Accordion>
    </div>
  );
}

interface ImageResultsProps {
  images: ImageResult[];
}

function ImageResults({ images }: ImageResultsProps) {
  return (
    <div className="grid w-full max-w-screen-sm grid-cols-2 gap-4 pr-2 md:grid-cols-3 lg:grid-cols-4">
      {images.map((image, index) => (
        <div key={index} className="overflow-hidden rounded-lg shadow-lg">
          <Image
            src={image.url}
            alt={image.title}
            width={300}
            height={200}
            className="h-full rounded-lg object-cover"
          />
        </div>
      ))}
    </div>
  );
}

interface VideoResultsProps {
  videos: VideoResult[];
}

function VideoResults({ videos }: VideoResultsProps) {
  return (
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
      {videos.map((video, index) => (
        <a
          key={index}
          href={video.url}
          target="_blank"
          rel="noopener noreferrer"
          className="group relative flex h-full flex-col rounded-lg bg-zinc-900 p-2 shadow-lg transition hover:bg-zinc-800"
        >
          <div className="absolute inset-0 flex items-center justify-center rounded-lg bg-black/50 transition group-hover:opacity-0">
            <Play fill="white" color="white" width={35} height={35} />
          </div>
          <img
            src={video.thumbnail}
            alt={video.title}
            className="h-full w-full rounded-lg object-cover"
          />
          <p className="relative z-[2] mt-1 truncate text-nowrap text-start text-sm">
            {video.title}
          </p>
          <div className="relative z-[2] mt-1 w-full truncate text-nowrap text-start text-xs">
            {video.source}
          </div>
        </a>
      ))}
    </div>
  );
}

interface NewsResultsProps {
  news: NewsResult[];
}

function NewsResults({ news }: NewsResultsProps) {
  return (
    <div className="space-y-2">
      {news.map((article, index) => (
        <div
          key={index}
          className="max-w-screen-sm overflow-hidden rounded-lg bg-zinc-800 p-4 shadow-md transition-all hover:shadow-lg"
        >
          <div className="flex flex-row items-center gap-2 text-primary transition-all hover:text-white">
            <NewsIcon
              color={undefined}
              height={20}
              width={20}
              className="size-[20px] min-w-[20px]"
            />
            <h2 className="truncate text-lg font-medium">
              <a href={article.url} target="_blank" rel="noopener noreferrer">
                {article.title}
              </a>
            </h2>
          </div>
          <p className="mb-1 line-clamp-2 text-sm text-foreground-700">
            {article.snippet}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 text-sm text-foreground-500">
            <span className="flex items-center">{timeAgo(article.date)}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

const timeAgo = (date: string | number | Date) => {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
};

interface WebResultsProps {
  web: WebResult[];
}

function WebResults({ web }: WebResultsProps) {
  return (
    <div className="space-y-2">
      {web.map((result, index) => (
        <div
          key={index}
          className="rounded-lg bg-zinc-800 p-4 shadow-md transition-all hover:shadow-lg"
        >
          <h2 className="truncate text-lg font-medium text-primary">
            <a
              href={result.url}
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white"
            >
              {result.title}
            </a>
          </h2>
          <p className="mb-1 line-clamp-2 text-sm text-foreground-700">
            {result.snippet}
          </p>
          <div className="flex flex-wrap items-center gap-x-4 text-sm text-foreground-500">
            <span className="flex items-center">
              <a
                href={result.url}
                className="max-w-xs truncate hover:text-primary hover:underline"
                target="_blank"
                rel="noopener noreferrer"
              >
                {new URL(result.url).hostname}
              </a>
            </span>
            {/* <span className="flex items-center">{timeAgo(result.date)}</span> */}
          </div>
        </div>
      ))}
    </div>
  );
}
