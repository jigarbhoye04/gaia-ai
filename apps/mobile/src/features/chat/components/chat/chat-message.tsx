import { View, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { MessageBubble } from "@/components/ui/message-bubble";
import { ToolDataRenderer } from "../../tool-data";
import { splitMessageByBreaks } from "../../utils/messageBreakUtils";
import type { Message } from "../../types";

interface FollowUpActionsProps {
  actions: string[];
  onActionPress?: (action: string) => void;
}

function FollowUpActions({ actions, onActionPress }: FollowUpActionsProps) {
  if (!actions || actions.length === 0) return null;

  return (
    <View className="mt-2 flex-row flex-wrap gap-2 pl-8">
      {actions.map((action) => (
        <Pressable
          key={action}
          onPress={() => onActionPress?.(action)}
          className="px-3 py-2 rounded-lg border-2 border-dotted border-muted/20 active:opacity-70"
        >
          <Text className="text-foreground text-xs">{action}</Text>
        </Pressable>
      ))}
    </View>
  );
}

interface ChatMessageProps {
  message: Message;
  onFollowUpAction?: (action: string) => void;
}

export function ChatMessage({ message, onFollowUpAction }: ChatMessageProps) {
  const isUser = message.isUser;
  const messageParts = splitMessageByBreaks(message.text || "");

  return (
    <View className={`flex-col py-2 ${isUser ? "items-end" : "items-start"}`}>
      <View className="flex-col gap-2 px-4" style={{ maxWidth: "85%" }}>
        {!isUser && message.toolData && message.toolData.length > 0 && (
          <ToolDataRenderer toolData={message.toolData} />
        )}

        {messageParts.map((part, index) => (
          <MessageBubble
            key={`${message.id}-${index}`}
            message={part}
            variant={isUser ? "sent" : "received"}
            grouped={
              messageParts.length === 1
                ? "none"
                : index === 0
                  ? "first"
                  : index === messageParts.length - 1
                    ? "last"
                    : "middle"
            }
          />
        ))}
      </View>

      {!isUser &&
        message.followUpActions &&
        message.followUpActions.length > 0 && (
          <FollowUpActions
            actions={message.followUpActions}
            onActionPress={onFollowUpAction}
          />
        )}
    </View>
  );
}
