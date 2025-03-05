// GoalSidebar.tsx
import { BookIcon1 } from "@/components/Misc/icons";
import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { Clock } from "lucide-react";
import React from "react";

interface GoalSidebarProps {
  nodes: any;
  currentlySelectedNodeId: string | null;
  handleCheckboxClick: () => void;
}

const GoalSidebar: React.FC<GoalSidebarProps> = ({
  nodes,
  currentlySelectedNodeId,
  handleCheckboxClick,
}) => {
  const selectedNode = nodes.find(
    (node: any) => node.id === currentlySelectedNodeId
  );

  return (
    <div className="fixed right-3 bottom-3 bg-zinc-800 max-w-[350px] p-2 rounded-xl flex flex-col gap-3 z-10 shadow-lg outline outline-2 outline-zinc-950">
      <div className="p-4 space-y-2">
        <div className="text-xl font-medium">{selectedNode?.data.label}</div>
        <div className="text-md -mt-2 text-foreground-600 pb-4">
          {selectedNode?.data?.details?.join(", ")}
        </div>
        <div className="space-y-4">
          {selectedNode?.data?.estimatedTime && (
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
              <span className="text-white text-md pl-1">
                {selectedNode.data.estimatedTime}
              </span>
            </Chip>
          )}
          {selectedNode && (
            <Chip
              color="success"
              size="lg"
              startContent={
                <Checkbox
                  isSelected={selectedNode.data.isComplete ?? false}
                  onValueChange={handleCheckboxClick}
                  color="success"
                  radius="full"
                >
                  Mark as Complete
                </Checkbox>
              }
              variant="flat"
            />
          )}
        </div>
      </div>
      {selectedNode?.data?.resources &&
        selectedNode.data.resources.length > 0 && (
          <div className="bg-black bg-opacity-40 p-5 rounded-xl">
            <div className="flex text-md font-medium gap-2 items-center pb-2">
              <BookIcon1 width={18} />
              Resources
            </div>
            <div className="text-sm">
              {selectedNode.data.resources.map(
                (resource: string, index: number) => (
                  <a
                    key={index}
                    className="hover:text-[#00bbff] underline underline-offset-4"
                    href={`https://www.google.com/search?q=${resource.split(
                      "+"
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <li>{resource}</li>
                  </a>
                )
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default GoalSidebar;
