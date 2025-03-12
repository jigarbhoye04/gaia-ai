// TextBubble.tsx
import { Chip } from "@heroui/chip";
import { AlertTriangleIcon, ArrowUpRight, Check, Loader2 } from "lucide-react";
import { lazy, Suspense } from "react";
import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import { parseDate } from "@/utils/fetchDate";
import CustomAnchor from "@/components/Chat/CodeBlock/CustomAnchor";
import CalendarEventSection from "./CalendarEventSection";
import { ChatBubbleBotProps } from "@/types/chatBubbleTypes";

const MarkdownRenderer = lazy(
  () => import("@/components/Chat/MarkdownRenderer")
);

interface TextBubbleProps extends ChatBubbleBotProps {
  fileScanningText: string;
}

export default function TextBubble({
  text,
  loading,
  searchWeb,
  pageFetchURL,
  filename,
  disclaimer,
  calendar_options,
  intent,
  fileScanningText,
}: TextBubbleProps) {
  console.log("intent in text bubble: ", intent);
  console.log("calendar_options in text bubble: ", calendar_options);

  return (
    <>
      <div className="chat_bubble bg-zinc-800">
        <div className="flex flex-col gap-3">
          {searchWeb && (
            <Chip
              color="primary"
              startContent={<span className="text-primary">🌐</span>}
              variant="flat"
            >
              <div className="font-medium flex items-center gap-1 text-primary">
                Live Search Results from the Web
              </div>
            </Chip>
          )}
          {!!pageFetchURL && (
            <Chip
              color="primary"
              startContent={<ArrowUpRight color="#00bbff" height={20} />}
              variant="flat"
            >
              <div className="font-medium flex items-center gap-1 text-primary">
                Fetched{" "}
                <CustomAnchor
                  props={{
                    href: pageFetchURL,
                    children: pageFetchURL.replace(/^https?:\/\//, ""),
                  }}
                />
              </div>
            </Chip>
          )}
          {!!filename && (
            <Chip color="primary" size="lg" variant="flat">
              {loading ? (
                <div className="flex items-center gap-2">
                  <span className="animate-spin">
                    <Loader2 className="text-white" height={17} width={17} />
                  </span>
                  {fileScanningText}
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Check className="text-white" height={17} width={17} />
                  Document Uploaded!
                </div>
              )}
            </Chip>
          )}

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
