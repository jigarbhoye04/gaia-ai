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
      className="bg-zinc-800 hover:bg-zinc-700 p-3 rounded-xl h-full overflow-hidden max-h-[195px] min-h-[150px] flex flex-col gap-2 transition-colors relative"
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
            <div className="font-medium flex items-center gap-1 text-primary">
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
            <div className="font-medium flex items-center gap-1 text-primary">
              Fetched
              <a
                className="!text-[#00bbff] font-medium hover:!text-white transition-colors"
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

      <div className="text-xs mt-auto text-foreground-500">
        {parseDate(message.date as string)}
      </div>
    </Link>
  );
};
