import { InternetIcon } from "@/components/Misc/icons";
import { parseDate } from "@/utils/fetchDate";
import { Chip } from "@heroui/chip";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
import React from "react";

interface PinCardProps {
  message: {
    message_id: string;
    response: string;
    searchWeb?: boolean;
    pageFetchURL?: string;
    date: string | Date;
    type: string;
  };
  conversation_id: string;
}

export const PinCard: React.FC<PinCardProps> = ({
  message,
  conversation_id,
}) => {
  return (
    <Link
      key={message.message_id}
      className="relative flex h-full max-h-[195px] min-h-[150px] flex-col gap-2 overflow-hidden rounded-xl bg-zinc-800 p-3 transition-colors hover:bg-zinc-700"
      href={{
        pathname: `/c/${conversation_id}`,
        query: { messageId: message.message_id },
      }}
    >
      {/* <Chip
        className="min-h-7"
        color={message.type === "bot" ? "primary" : "default"}
      >
        {message.type === "bot" ? "From GAIA" : "From You"}
      </Chip> */}

      {/* <div className="absolute right-1 top-1">
        <PinIcon color="#00bbff" fill="#00bbff" height={25} width={25} />
      </div> */}

      <div>
        {message.searchWeb && (
          <Chip
            color="primary"
            size="sm"
            startContent={<InternetIcon color="#00bbff" height={20} />}
            variant="flat"
          >
            <div className="flex items-center gap-1 font-medium text-primary">
              Web Search Results
            </div>
          </Chip>
        )}

        {message.pageFetchURL && (
          <Chip
            color="primary"
            size="sm"
            startContent={<ArrowUpRight color="#00bbff" height={20} />}
            variant="flat"
          >
            <div className="flex items-center gap-1 font-medium text-primary">
              Fetched
              <a
                className="font-medium !text-[#00bbff] transition-colors hover:!text-white"
                href={message.pageFetchURL}
                rel="noreferrer"
                target="_blank"
              >
                {message.pageFetchURL.replace(/^https?:\/\//, "")}
              </a>
            </div>
          </Chip>
        )}
      </div>

      <div className="max-h-[135px] overflow-hidden text-sm">
        {message.response.slice(0, 350)}
        {message.response.length > 350 ? "..." : ""}
      </div>

      <div className="mt-auto text-xs text-foreground-500">
        {parseDate(message.date as string)}
      </div>
    </Link>
  );
};
