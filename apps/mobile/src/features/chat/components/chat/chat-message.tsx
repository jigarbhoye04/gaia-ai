import { View, ScrollView, Pressable } from "react-native";
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
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      className="mt-2"
      contentContainerStyle={{ gap: 8, paddingLeft: 32 }}
    >
      {actions.map((action) => (
        <Pressable
          key={action}
          onPress={() => onActionPress?.(action)}
          className="px-3 py-2 rounded-full bg-surface border border-muted/20 active:opacity-70"
        >
          <Text className="text-foreground text-sm">{action}</Text>
        </Pressable>
      ))}
    </ScrollView>
  );
}

interface ChatMessageProps {
  message: Message;
  onFollowUpAction?: (action: string) => void;
}

export function ChatMessage({ message, onFollowUpAction }: ChatMessageProps) {
  const isUser = message.isUser;
  const messageParts = splitMessageByBreaks(message.text || "");
  console.log('this is the message parts',messageParts);

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
