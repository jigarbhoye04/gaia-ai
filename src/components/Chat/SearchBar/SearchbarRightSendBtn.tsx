import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";

import { SentIcon } from "../../Misc/icons";

interface RightSideProps {
  textHeight: number;
  isLoadingStream: boolean;
  onSubmit: () => void;
}

export default function RightSide({
  textHeight,
  isLoadingStream,
  onSubmit,
}: RightSideProps) {
  return (
    <div className="ml-2 flex items-center gap-1">
      <Tooltip content="Send message" placement="right">
        <Button
          isIconOnly
          aria-label="Send message"
          className={`${isLoadingStream && "cursor-wait"}`}
          color="primary"
          disabled={isLoadingStream}
          isLoading={isLoadingStream}
          radius="full"
          type="submit"
        >
          <SentIcon color="black" />
        </Button>
      </Tooltip>
    </div>
  );
}
