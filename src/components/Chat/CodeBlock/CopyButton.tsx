import React from "react";
import { Button } from "@heroui/button";
import { Task01Icon, TaskDone01Icon } from "../../Misc/icons";

interface CopyButtonProps {
  copied: boolean;
  onPress: () => void;
}

const CopyButton: React.FC<CopyButtonProps> = ({ copied, onPress }) => (
  <Button
    className="text-foreground hover:text-gray-300 text-xs"
    size="sm"
    variant="light"
    onPress={onPress}
  >
    {copied ? (
      <div className="flex flex-row gap-1 items-center">
        <TaskDone01Icon color="foreground" width={21} />
        <p>Copied!</p>
      </div>
    ) : (
      <div className="flex flex-row gap-1 items-center">
        <Task01Icon color="foreground" width={21} />
        <p>Copy Code</p>
      </div>
    )}
  </Button>
);

export default CopyButton;
