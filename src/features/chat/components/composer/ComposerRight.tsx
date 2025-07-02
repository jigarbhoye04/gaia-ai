import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { ArrowUp } from "lucide-react";

import { useLoading } from "@/features/chat/hooks/useLoading";

interface RightSideProps {
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
  searchbarText: string;
}

export default function RightSide({
  handleFormSubmit,
  searchbarText,
}: RightSideProps) {
  const { isLoading } = useLoading();
  const hasText = searchbarText.trim().length > 0;
  const isDisabled = isLoading || !hasText;

  return (
    <div className="ml-2 flex items-center gap-1">
      <Tooltip content="Send message" placement="right">
        <Button
          isIconOnly
          aria-label="Send message"
          className={`${isLoading && "cursor-wait"}`}
          color={hasText ? "primary" : "default"}
          disabled={isDisabled}
          isLoading={isLoading}
          radius="full"
          type="submit"
          onPress={() => handleFormSubmit()}
        >
          <ArrowUp color={hasText ? "black" : "gray"} />
        </Button>
      </Tooltip>
    </div>
  );
}
