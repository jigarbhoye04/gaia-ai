// TextBubble.tsx
import { Chip } from "@heroui/chip";
import { AlertTriangleIcon, ArrowUpRight } from "lucide-react";

import { InternetIcon } from "@/components/shared/icons";
import DeepSearchResultsTabs from "@/features/chat/components/bubbles/bot/DeepSearchResultsTabs";
import SearchResultsTabs from "@/features/chat/components/bubbles/bot/SearchResultsTabs";
import CustomAnchor from "@/features/chat/components/code-block/CustomAnchor";
import { WeatherCard } from "@/features/weather/components/WeatherCard";
import { ChatBubbleBotProps } from "@/types/features/chatBubbleTypes";

import MarkdownRenderer from "../../interface/MarkdownRenderer";
import { CalendarDeleteSection } from "./CalendarDeleteSection";
import { CalendarEditSection } from "./CalendarEditSection";
import CalendarEventSection from "./CalendarEventSection";
import CodeExecutionSection from "./CodeExecutionSection";
import DocumentSection from "./DocumentSection";
import EmailComposeSection from "./EmailComposeSection";
import GoalSection, { type GoalAction } from "./GoalSection";
import TodoSection from "./TodoSection";

export default function TextBubble({
  text,
  searchWeb,
  deepSearchWeb,
  pageFetchURLs,
  disclaimer,
  calendar_options,
  calendar_delete_options,
  calendar_edit_options,
  email_compose_data,
  weather_data,
  todo_data,
  goal_data,
  code_data,
  intent,
  search_results,
  deep_search_results,
  document_data,
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

      {intent === "delete_calendar_event" && calendar_delete_options && (
        <CalendarDeleteSection
          calendar_delete_options={calendar_delete_options}
        />
      )}

      {intent === "edit_calendar_event" && calendar_edit_options && (
        <CalendarEditSection calendar_edit_options={calendar_edit_options} />
      )}

      {email_compose_data && (
        <EmailComposeSection email_compose_data={email_compose_data} />
      )}

      {todo_data && (
        <TodoSection
          todos={todo_data.todos}
          projects={todo_data.projects}
          stats={todo_data.stats}
          action={todo_data.action}
          message={todo_data.message}
        />
      )}

      {document_data && <DocumentSection document_data={document_data} />}

      {goal_data && (
        <GoalSection
          goals={goal_data.goals}
          stats={goal_data.stats}
          action={goal_data.action as GoalAction}
          message={goal_data.message}
          goal_id={goal_data.goal_id}
          deleted_goal_id={goal_data.deleted_goal_id}
          error={goal_data.error}
        />
      )}

      {code_data && <CodeExecutionSection code_data={code_data} />}
    </>
  );
}
