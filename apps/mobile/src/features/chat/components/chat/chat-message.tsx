import { View, ScrollView, Pressable } from "react-native";
import { Text } from "@/components/ui/text";
import { MessageBubble } from "@/components/ui/message-bubble";
import { ToolDataRenderer } from "../../tool-data";
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

  return (
    <View className={`flex-col py-2 ${isUser ? "items-end" : "items-start"}`}>
      <View className="flex-col flex-1 gap-2 px-4">
        {!isUser && message.toolData && message.toolData.length > 0 && (
          <ToolDataRenderer toolData={message.toolData} />
        )}

        {message.text && (
          <MessageBubble
            message={message.text}
            variant={isUser ? "sent" : "received"}
          />
        )}
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
