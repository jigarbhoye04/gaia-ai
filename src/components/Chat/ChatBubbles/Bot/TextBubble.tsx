// TextBubble.tsx
import { Chip } from "@heroui/chip";
import { AlertTriangleIcon, ArrowUpRight } from "lucide-react";

import CustomAnchor from "@/components/Chat/CodeBlock/CustomAnchor";
import { InternetIcon } from "@/components/Misc/icons";
import { WeatherCard } from "@/components/Weather/WeatherCard";
import { ChatBubbleBotProps } from "@/types/chatBubbleTypes";

import MarkdownRenderer from "../../MarkdownRenderer";
import CalendarEventSection from "./CalendarEventSection";
import EmailComposeSection from "./EmailComposeSection";
import DeepSearchResultsTabs from "./SearchResults/DeepSearchResultsTabs";
import SearchResultsTabs from "./SearchResults/SearchResultsTabs";

export default function TextBubble({
  text,
  searchWeb,
  deepSearchWeb,
  pageFetchURLs,
  disclaimer,
  calendar_options,
  email_compose_data,
  weather_data,
  intent,
  search_results,
  deep_search_results,
}: ChatBubbleBotProps) {
  return (
    <>
      {!!search_results && (
        <SearchResultsTabs search_results={search_results} />
      )}

      {deep_search_results && (
        <DeepSearchResultsTabs deep_search_results={deep_search_results} />
      )}

      {weather_data && <WeatherCard weatherData={weather_data} />}

      {(!!searchWeb ||
        !!deepSearchWeb ||
        (!!pageFetchURLs && pageFetchURLs?.length > 0) ||
        !!text.trim()) && (
        <div className="chat_bubble bg-zinc-800">
          <div className="flex flex-col gap-3">
            {(searchWeb || !!search_results) && (
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

            {(deepSearchWeb || !!deep_search_results) && (
              <Chip
                color="primary"
                startContent={<InternetIcon color="#00bbff" height={20} />}
                variant="flat"
              >
                <div className="flex items-center gap-1 font-medium text-primary">
                  Deep Search Results from the Web
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
      )}

      {intent === "calendar" && calendar_options && (
        <CalendarEventSection calendar_options={calendar_options} />
      )}

      {intent === "email" && email_compose_data && (
        <EmailComposeSection email_compose_data={email_compose_data} />
      )}
    </>
  );
}
