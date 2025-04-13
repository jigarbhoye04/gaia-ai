import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { Clock } from "lucide-react";
import React from "react";

import useMediaQuery from "@/hooks/useMediaQuery";

import { BookIcon1 } from "../../Misc/icons";

const StaticSidebar = ({
  isVisible,
  isComplete,
  setIsComplete,
}: {
  isVisible: boolean;
  isComplete: boolean;
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");

  const label = "Task Name";
  const details = [
    "When you click on a task after setting a goal, this sidebar appears. You can mark the task as complete and see the estimated time and resources needed to finish it!",
  ];
  const estimatedTime = "1 month";
  const resources = ["Resource 1", "Resource 2", "Resource 3"];

  return (
    // <div
    //   className={`z-20 h-fit flex-col gap-3 rounded-xl bg-zinc-800 p-2 shadow-lg outline outline-2 outline-zinc-950 ${isMobileScreen ? "relative" : "absolute sm:-bottom-14 sm:-right-14 sm:max-w-[350px]"} transition-all`}
    // ></div>
    <div
      className={`relative z-20 h-fit flex-col gap-3 rounded-xl bg-zinc-800 p-2 shadow-lg outline outline-2 outline-zinc-950 sm:absolute sm:-bottom-14 sm:-right-14 sm:max-w-[350px] ${
        isVisible
          ? `pointer-events-auto flex opacity-100`
          : "pointer-events-none hidden opacity-0"
      } transition-all`}
    >
      <div className="space-y-2 p-4">
        <div className="text-xl font-medium">{label}</div>
        <div className="text-md -mt-2 pb-4 text-foreground-600">
          {details.join(" ")}
        </div>
        <div className="space-y-4">
          {estimatedTime && (
            <Chip
              color="primary"
              size="lg"
              startContent={
                <div className="text-md flex items-center gap-1">
                  <Clock width={18} />
                  Estimated Time:
                </div>
              }
              variant="flat"
            >
              <span className="text-md pl-1 text-white">{estimatedTime}</span>
            </Chip>
          )}

          <Chip
            color="success"
            size="lg"
            startContent={
              <Checkbox
                color="success"
                isSelected={isComplete}
                radius="full"
                onValueChange={() => {
                  if (!isMobileScreen) setIsComplete((prev) => !prev);
                }}
              >
                Mark as Complete
              </Checkbox>
            }
            variant="flat"
          />
        </div>
      </div>

      {resources && resources.length > 0 && (
        <div className="rounded-xl bg-black bg-opacity-40 p-5">
          <div className="text-md flex items-center gap-2 pb-2 font-medium">
            <BookIcon1 width={18} />
            Resources
          </div>
          <ul className="text-sm">
            {resources.map((resource, index) => (
              <li
                className="cursor-pointer underline underline-offset-4 hover:text-[#00bbff]"
                key={index}
                // href={`https://www.google.com/search?q=${resource.split("+")}`}
              >
                {resource}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default StaticSidebar;
