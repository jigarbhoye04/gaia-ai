// TextBubble.tsx
import CustomAnchor from "@/components/Chat/CodeBlock/CustomAnchor";
import { InternetIcon } from "@/components/Misc/icons";
import { ChatBubbleBotProps } from "@/types/chatBubbleTypes";
import { Chip } from "@heroui/chip";
import { AlertTriangleIcon, ArrowUpRight } from "lucide-react";
import MarkdownRenderer from "../../MarkdownRenderer";
import CalendarEventSection from "./CalendarEventSection";
import DeepSearchResultsTabs from "./DeepSearchResults";
import SearchResultsTabs from "./SearchResults";

export default function TextBubble({
  text,
  searchWeb,
  deepSearchWeb,
  pageFetchURLs,
  disclaimer,
  calendar_options,
  intent,
  search_results,
  deep_search_results,
}: ChatBubbleBotProps) {
  console.log("deep_search_results", deep_search_results);
  return (
    <>
      {!!search_results && (
        <SearchResultsTabs search_results={search_results} />
      )}

      {deep_search_results && (
        <DeepSearchResultsTabs deep_search_results={deep_search_results} />
      )}

      <div className="chat_bubble bg-zinc-800">
        <div className="flex flex-col gap-3">
          {searchWeb && (
            <Chip
              color="primary"
              startContent={<InternetIcon color="#00bbff" height={20} />}
              variant="flat"
            >
              <div className="flex items-center gap-1 font-medium text-primary">
                Live Search Results from the Web
              </div>
            </Chip>
          )}

          {deepSearchWeb && (
            <Chip
              color="primary"
              startContent={<InternetIcon color="#00bbff" height={20} />}
              variant="flat"
            >
              <div className="flex items-center gap-1 font-medium text-primary">
                Enhanced Search Results from the Web
              </div>
            </Chip>
          )}

          {!!pageFetchURLs &&
            pageFetchURLs.map((pageFetchURL, index) => (
              <Chip
                key={index}
                color="primary"
                startContent={<ArrowUpRight color="#00bbff" height={20} />}
                variant="flat"
              >
                <div className="flex items-center gap-1 font-medium text-primary">
                  Fetched{" "}
                  <CustomAnchor href={pageFetchURL}>
                    {pageFetchURL.replace(/^https?:\/\//, "")}
                  </CustomAnchor>
                </div>
              </Chip>
            ))}

          {!!text && <MarkdownRenderer content={text.toString()} />}

          {!!disclaimer && (
            <Chip
              className="text-xs font-medium text-warning-500"
              color="warning"
              size="sm"
              startContent={
                <AlertTriangleIcon className="text-warning-500" height={17} />
              }
              variant="flat"
            >
              {disclaimer}
            </Chip>
          )}
        </div>
      </div>

      {intent === "calendar" && calendar_options && (
        <CalendarEventSection calendar_options={calendar_options} />
      )}
    </>
  );
}
