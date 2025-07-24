import { Button } from "@heroui/button";
import { useParams } from "next/navigation";

import { useLoading } from "@/features/chat/hooks/useLoading";
import { useSendMessage } from "@/features/chat/hooks/useSendMessage";

interface FollowUpActionsProps {
  actions: string[];
}

export default function FollowUpActions({ actions }: FollowUpActionsProps) {
  const { id: convoIdParam } = useParams<{ id: string }>();
  const sendMessage = useSendMessage(convoIdParam ?? null);
  const { isLoading } = useLoading();

  const handleActionClick = async (action: string) => {
    if (isLoading) return;

    try {
      // Send the follow-up action as a message
      await sendMessage(
        action,
        null, // No search mode
        [], // No page fetch URLs
        [], // No file data
        null, // No selected tool
        null, // No tool category
      );
    } catch (error) {
      console.error("Failed to send follow-up action:", error);
    }
  };

  if (!actions || actions.length === 0) {
    return null;
  }

  return (
    <div className="flex max-w-xl flex-wrap gap-2 px-1 pt-3 pb-1">
      {actions.map((action, index) => (
        <Button
          key={index}
          className="text-xs text-foreground-500 transition-colors hover:text-foreground-700"
          variant="flat"
          size="sm"
          onPress={() => handleActionClick(action)}
          isDisabled={isLoading}
        >
          {action}
        </Button>
      ))}
    </div>
  );
}
