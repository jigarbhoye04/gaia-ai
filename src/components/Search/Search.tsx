import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Spinner } from "@heroui/spinner";
import { ArrowUpRight, SearchIcon } from "lucide-react";
import { useState } from "react";
import Link from "next/link";
import { parseDate } from "@/utils/fetchDate";
import { apiauth } from "@/utils/apiaxios";
import { ScrollArea } from "@/components/ui/scroll-area";
import { InternetIcon } from "@/components/Misc/icons";

// Define types for fetched messages
interface Message {
  message: {
    message_id: string;
    response: string;
    searchWeb: boolean;
    pageFetchURL: string;
    date: string;
    type: string;
  };
  conversation_id: string;
}

export default function Search() {
  const [fetchedResults, setFetchedResults] = useState<Message[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);

  const handleSearch = async () => {
    setLoading(true);
    try {
      const response = await apiauth.get("/search/messages", {
        params: { query: searchQuery },
      });

      setFetchedResults(response.data.results);
    } catch (error) {
      console.error("Error fetching messages:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="flex flex-col justify-between h-full">
        <ScrollArea>
          <div className="flex items-center flex-col gap-2">
            <h1 className="font-bold text-center text-5xl">Search</h1>
            <div className=" text-center text-md pb-6 max-w-screen-md">
              Lorem, ipsum dolor sit amet consectetur adipisicing elit. Facilis,
              sed!
            </div>
          </div>

          {loading ? (
            <div className="h-[80vh] flex items-center justify-center">
              <Spinner />
            </div>
          ) : (
            <div className="flex flex-wrap gap-4 justify-center pb-8 ">
              <div>
                {!!fetchedResults && fetchedResults?.length > 0 ? (
                  <div className="grid gap-3 px-[10%] grid-cols-[repeat(auto-fill,_minmax(15vw,_1fr))]">
                    {fetchedResults.map((result) => (
                      <Link
                        key={result.message.message_id}
                        className="bg-black p-3 rounded-xl h-full overflow-hidden max-h-[190px] min-h-[190px] flex flex-col gap-2 outline outline-zinc-800 outline-2 hover:bg-zinc-800 transition-colors"
                        href={{
                          pathname: `/c/${result.conversation_id}`,
                          query: { messageId: result.message.message_id },
                        }}
                      >
                        <Chip
                          className="min-h-7"
                          color={
                            result.message.type == "bot" ? "primary" : "default"
                          }
                        >
                          {result.message.type == "bot"
                            ? "From GAIA"
                            : "From You"}
                        </Chip>

                        <div>
                          {result.message?.searchWeb && (
                            <Chip
                              color="primary"
                              size="sm"
                              startContent={
                                <InternetIcon color="#00bbff" height={20} />
                              }
                              variant="flat"
                            >
                              <div className="font-medium flex items-center gap-1 text-primary">
                                Live Search Results from the Web
                              </div>
                            </Chip>
                          )}

                          {!!result.message?.pageFetchURL && (
                            <Chip
                              color="primary"
                              size="sm"
                              startContent={
                                <ArrowUpRight color="#00bbff" height={20} />
                              }
                              variant="flat"
                            >
                              <div className="font-medium flex items-center gap-1 text-primary">
                                Fetched
                                <a
                                  className="!text-[#00bbff] font-medium hover:!text-white transition-colors"
                                  href={result.message.pageFetchURL}
                                  rel="noreferrer"
                                  target="_blank"
                                >
                                  {result.message.pageFetchURL.replace(
                                    /^https?:\/\//,
                                    ""
                                  )}
                                </a>
                              </div>
                            </Chip>
                          )}
                        </div>
                        <div className="max-h-[140px] overflow-hidden text-sm">
                          {result.message?.response?.slice(0, 350)}
                          {result?.message?.response?.length > 350 ? "..." : ""}
                        </div>
                        <div className="text-xs mt-auto text-foreground-400">
                          {parseDate(result?.message?.date)}
                        </div>
                      </Link>
                    ))}
                  </div>
                ) : (
                  <></>
                )}
              </div>
            </div>
          )}
        </ScrollArea>

        <div className="absolute left-0 bottom-5 flex justify-center items-center w-full z-10">
          <div className="flex items-center gap-3 max-w-screen-sm w-full">
            <Input
              autoFocus
              className="w-full"
              classNames={{ inputWrapper: "pr-1" }}
              endContent={
                <Button
                  isIconOnly
                  color="primary"
                  radius="full"
                  onClick={handleSearch}
                >
                  <SearchIcon />
                </Button>
              }
              placeholder="Enter a message to search:   "
              radius="full"
              size="lg"
              value={searchQuery}
              variant="faded"
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSearch();
              }}
            />
          </div>
        </div>
        <div className="bg-custom-gradient2 left-0 absolute bottom-0 w-full h-[100px] z-[1]" />
      </div>
    </>
  );
}
