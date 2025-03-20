import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import { Node } from "@xyflow/react";
import { Clock } from "lucide-react";
import React from "react";

import { BookIcon1 } from "@/components/Misc/icons";
import { NodeData } from "@/types/goalTypes";

interface GoalSidebarProps {
  nodes: Node<NodeData>[];
  currentlySelectedNodeId: string | null;
  handleCheckboxClick: () => void;
}

const GoalSidebar: React.FC<GoalSidebarProps> = ({
  nodes,
  currentlySelectedNodeId,
  handleCheckboxClick,
}) => {
  const selectedNode = nodes.find(
    (node) => node.id === currentlySelectedNodeId,
  );

  return (
    <div className="fixed bottom-3 right-3 z-10 flex max-w-[350px] flex-col gap-3 rounded-xl bg-zinc-800 p-2 shadow-lg outline outline-2 outline-zinc-950">
      <div className="space-y-2 p-4">
        <div className="text-xl font-medium">{selectedNode?.data.label}</div>
        <div className="text-md -mt-2 pb-4 text-foreground-600">
          {selectedNode?.data?.details?.join(", ")}
        </div>
        <div className="space-y-4">
          {selectedNode?.data?.estimatedTime && (
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
              <span className="text-md pl-1 text-white">
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
          <div className="rounded-xl bg-black bg-opacity-40 p-5">
            <div className="text-md flex items-center gap-2 pb-2 font-medium">
              <BookIcon1 width={18} />
              Resources
            </div>
            <div className="text-sm">
              {selectedNode.data.resources.map(
                (resource: string, index: number) => (
                  <a
                    key={index}
                    className="underline underline-offset-4 hover:text-[#00bbff]"
                    href={`https://www.google.com/search?q=${resource.split(
                      "+",
                    )}`}
                    target="_blank"
                    rel="noreferrer"
                  >
                    <li>{resource}</li>
                  </a>
                ),
              )}
            </div>
          </div>
        )}
    </div>
  );
};

export default GoalSidebar;
