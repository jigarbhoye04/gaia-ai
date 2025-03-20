import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";

import { SentIcon } from "../../Misc/icons";

interface RightSideProps {
  loading: boolean;
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
}

export default function RightSide({
  loading,
  handleFormSubmit,
}: RightSideProps) {
  return (
    <div className="ml-2 flex items-center gap-1">
      <Tooltip content="Send message" placement="right">
        <Button
          isIconOnly
          aria-label="Send message"
          className={`${loading && "cursor-wait"}`}
          color="primary"
          disabled={loading}
          isLoading={loading}
          radius="full"
          type="submit"
          onPress={() => handleFormSubmit()}
        >
          <SentIcon color="black" />
        </Button>
      </Tooltip>
    </div>
  );
}
