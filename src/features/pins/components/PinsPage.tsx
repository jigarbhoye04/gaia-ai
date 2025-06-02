"use client";

import { Input } from "@heroui/input";
import { DeleteIcon } from "lucide-react";
import { useEffect, useState } from "react";

import Spinner from "@/components/ui/shadcn/spinner";
import { PinCard } from "@/features/pins/components/PinCard";
import { usePins } from "@/features/pins/hooks/usePins";
import { PinCardProps } from "@/types/features/pinTypes";

export default function Pins() {
  const { pins: fetchedResults, loading, fetchPins } = usePins();
  const [filteredResults, setFilteredResults] = useState<PinCardProps[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>("");

  useEffect(() => {
    fetchPins();
  }, [fetchPins]);

  useEffect(() => {
    setFilteredResults(fetchedResults);
  }, [fetchedResults]);

  const filterPins = (query: string) => {
    const filtered = fetchedResults.filter((result) =>
      result.message.response.toLowerCase().includes(query.toLowerCase()),
    );
    setFilteredResults(filtered);
  };

  return (
    <div className="flex h-full flex-col justify-between">
      <div className="overflow-y-auto">
        {/* <div className="flex items-center flex-col gap-2"> */}
        <h1 className="pb-6 text-center text-4xl font-bold sm:text-5xl">
          Pinned Messages
        </h1>
        {/* <div className="text-center text-md pb-6 max-w-(--breakpoint-md)">
            Lorem, ipsum dolor sit amet consectetur adipisicing elit. Facilis,
            sed!
          </div> */}
        {/* </div> */}

        {loading ? (
          <div className="flex h-[80vh] items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <div className="flex flex-wrap justify-center gap-4 pb-8">
            <div className="flex flex-wrap justify-center gap-4 pb-8 sm:px-[10vw]">
              {/* // <div className="grid gap-3 px-1 sm:px-[10%] sm:grid-cols-[repeat(auto-fill,minmax(15vw,1fr))] grid-cols-[repeat(auto-fill,minmax(1fr,1fr))] pb-24 sm:pb-20"> */}
              {!!filteredResults && filteredResults.length > 0 ? (
                <div className="grid grid-cols-1 gap-4 pb-24 sm:grid-cols-3 sm:pb-20">
                  {filteredResults.map((result) => (
                    <PinCard
                      key={result.message.message_id}
                      conversation_id={result.conversation_id}
                      message={result.message}
                    />
                  ))}
                </div>
              ) : (
                <></>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 left-0 z-10 flex w-full flex-col items-center justify-center px-3 sm:bottom-5">
        <div className="relative flex w-full max-w-(--breakpoint-sm) items-center gap-3">
          {searchQuery.trim().length > 0 && (
            <div className="div absolute right-2 bottom-14 flex w-full justify-end text-sm">
              <div
                className="flex w-fit cursor-pointer flex-row items-center gap-1 rounded-full bg-foreground-100 px-4 py-1 text-foreground-600"
                onClick={() => {
                  setSearchQuery("");
                  filterPins("");
                }}
              >
                Clear Query <DeleteIcon height={17} width={17} />
              </div>
            </div>
          )}

          <Input
            autoFocus
            className="w-full"
            classNames={{ inputWrapper: "pr-1" }}
            placeholder="Enter a message to filter pins"
            radius="full"
            size="lg"
            value={searchQuery}
            variant="faded"
            onChange={(e) => {
              const query = e.target.value;

              setSearchQuery(query);
              filterPins(query);
            }}
          />
        </div>
      </div>
      <div className="bg-custom-gradient2 absolute bottom-0 left-0 z-1 h-[100px] w-full" />
    </div>
  );
}
