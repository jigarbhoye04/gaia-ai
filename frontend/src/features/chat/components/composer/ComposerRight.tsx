import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { SendHorizontal, AudioLines, Square } from "lucide-react";

import { useLoading } from "@/features/chat/hooks/useLoading";

interface RightSideProps {
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  searchbarText: string;
  selectedTool?: string | null;
  setvoiceModeActive: () => void;
}

export default function RightSide({
  handleFormSubmit,
  searchbarText,
  selectedTool,
  setvoiceModeActive,
}: RightSideProps) {
  const { isLoading, stopStream } = useLoading();

  const hasText = searchbarText.trim().length > 0;
  const hasSelectedTool = selectedTool !== null && selectedTool !== undefined;
  const isDisabled = isLoading || (!hasText && !hasSelectedTool);

  const getTooltipContent = () => {
    if (isLoading) return "Stop generation";

    if (hasSelectedTool && !hasText) {
      const formattedToolName = selectedTool
        ?.split("_")
        .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
        .join(" ");
      return `Send with ${formattedToolName}`;
    }
    return "Send message";
  };

  const handleButtonPress = () => {
    if (isLoading) {
      stopStream();
    } else {
      handleFormSubmit();
    }
  };

  return (
    <div className="ml-2 flex items-center gap-2">
      <Tooltip content="Voice Mode" placement="left" color="primary" showArrow>
        <Button
          isIconOnly
          aria-label="Voice Mode"
          className="h-9 min-h-9 w-9 max-w-9 min-w-9"
          color="default"
          radius="full"
          type="button"
          onPress={() => setvoiceModeActive()}
        >
          <AudioLines />
        </Button>
      </Tooltip>

      <Tooltip content={getTooltipContent()} placement="right"  color={isLoading ? "danger" : "primary"} showArrow>
        <Button
          isIconOnly
          aria-label={isLoading ? "Stop generation" : "Send message"}
          className={`h-9 min-h-9 w-9 max-w-9 min-w-9 ${isLoading ? "cursor-pointer" : ""}`}
          color={
            isLoading
              ? "primary"
              : hasText || hasSelectedTool
                ? "primary"
                : "default"
          }
          disabled={!isLoading && isDisabled}
          radius="full"
          type="submit"
          onPress={handleButtonPress}
        >
          {isLoading ? (
            <Square color="black" width={17} height={17} fill="black" />
          ) : (
            <SendHorizontal  color={hasText || hasSelectedTool ? "black" : "gray"} />
          )}
        </Button>
      </Tooltip>
    </div>
  );
}
