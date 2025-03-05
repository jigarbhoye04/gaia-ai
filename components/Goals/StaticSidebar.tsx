import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { Clock } from "lucide-react";
import React from "react";

import { BookIcon1 } from "../Misc/icons";

const StaticSidebar = ({
  // hover1,
  isVisible,
  isComplete,
  setIsComplete,
}: {
  // hover1: boolean;
  isVisible: boolean;
  isComplete: boolean;
  setIsComplete: React.Dispatch<React.SetStateAction<boolean>>;
}) => {
  const label = "Task Name";
  const details = [
    "When you click on a task after setting a goal, this sidebar appears. You can mark the task as complete and see the estimated time and resources needed to finish it!",
  ];
  const estimatedTime = "1 month";
  const resources = ["Resource 1", "Resource 2", "Resource 3"];

  return (
    <div
      className={`sm:fixed relative sm:right-3 sm:bottom-3 bg-zinc-800 max-w-[350px] p-2 rounded-xl z-10 flex-col gap-3 shadow-lg outline outline-2 outline-zinc-950 sm:flex hidden 
        ${
          isVisible
            ? `sm:opacity-100 pointer-events-auto`
            : "sm:opacity-0 pointer-events-none"
        } transition-all
    `}
    >
      <div className="p-4 space-y-2">
        <div className="text-xl font-medium">{label}</div>
        <div className="text-md -mt-2 text-foreground-600 pb-4">
          {details.join(" ")}
        </div>
        <div className="space-y-4">
          {estimatedTime && (
            <Chip
              color="primary"
              size="lg"
              startContent={
                <div className="flex items-center gap-1 text-md">
                  <Clock width={18} />
                  Estimated Time:
                </div>
              }
              variant="flat"
            >
              <span className="text-white text-md pl-1">{estimatedTime}</span>
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
                onValueChange={setIsComplete}
                // isSelected={isComplete}
                // onValueChange={handleCheckboxClick} // No need for a function, as it's static
              >
                Mark as Complete
              </Checkbox>
            }
            variant="flat"
          />
        </div>
      </div>

      {resources && resources.length > 0 && (
        <div className="bg-black bg-opacity-40 p-5 rounded-xl">
          <div className="flex text-md font-medium gap-2 items-center pb-2">
            <BookIcon1 width={18} />
            Resources
          </div>
          <ul className="text-sm">
            {resources.map((resource, index) => (
              <li
                className="hover:text-[#00bbff] underline underline-offset-4 cursor-pointer"
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
