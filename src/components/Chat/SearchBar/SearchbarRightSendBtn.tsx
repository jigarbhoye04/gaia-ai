import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";

import { useLoading } from "@/hooks/useLoading";

import { SentIcon } from "../../Misc/icons";

interface RightSideProps {
  handleFormSubmit: (e?: React.FormEvent<HTMLFormElement>) => void;
}

export default function RightSide({ handleFormSubmit }: RightSideProps) {
  const { isLoading } = useLoading();

  return (
    <div className="ml-2 flex items-center gap-1">
      <Tooltip content="Send message" placement="right">
        <Button
          isIconOnly
          aria-label="Send message"
          className={`${isLoading && "cursor-wait"}`}
          color="primary"
          disabled={isLoading}
          isLoading={isLoading}
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
