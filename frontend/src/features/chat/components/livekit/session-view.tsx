"use client";

import React, { useEffect, useState } from "react";
import { motion } from "motion/react";
import {
  type AgentState,
  useRoomContext,
  useVoiceAssistant,
} from "@livekit/components-react";
import { toast } from "sonner";
import { AgentControlBar } from "@/features/chat/components/livekit/agent-control-bar";
import { MediaTiles } from "@/features/chat/components/livekit/media-tiles";
import useChatAndTranscription from "@/features/chat/components/livekit/hooks/useChatAndTranscription";
import ChatRenderer from "@/features/chat/components/interface/ChatRenderer";
import { useConversation } from "@/features/chat/hooks/useConversation";
import type { MessageType } from "@/types/features/convoTypes";
import { cn } from "@/lib/utils";

function isAgentAvailable(agentState: AgentState) {
  return (
    agentState == "listening" ||
    agentState == "thinking" ||
    agentState == "speaking"
  );
}

interface SessionViewProps {
  disabled: boolean;
  sessionStarted: boolean;
  onEndCall: () => void;
}

export const SessionView = ({
  disabled,
  sessionStarted,
  onEndCall,
  ref,
}: React.ComponentProps<"div"> & SessionViewProps) => {
  const { state: agentState } = useVoiceAssistant();
  const [chatOpen, setChatOpen] = useState(false);
  const { messages } = useChatAndTranscription();
  const room = useRoomContext();
  const { updateConvoMessages } = useConversation();
  const [voiceBuffer, setVoiceBuffer] = useState<MessageType[]>([]);

  // Buffer voice messages locally, do not update Redux on every message
  useEffect(() => {
    if (messages && messages.length > 0) {
      setVoiceBuffer(messages);
    }
    console.log(messages);
  }, [messages]);

  // Handler to persist buffered messages to Redux when call ends
  const handleEndCall = React.useCallback(() => {
    updateConvoMessages((oldMessages) => {
      const allMessages = [...oldMessages, ...voiceBuffer];
      const uniqueMessagesMap = new Map();
      for (const msg of allMessages) {
        uniqueMessagesMap.set(msg.message_id, msg);
      }
      return Array.from(uniqueMessagesMap.values());
    });
    onEndCall();
  }, [voiceBuffer, updateConvoMessages, onEndCall]);

  useEffect(() => {
    if (sessionStarted) {
      const timeout = setTimeout(() => {
        if (!isAgentAvailable(agentState)) {
          const reason =
            agentState === "connecting"
              ? "Agent did not join the room. "
              : "Agent connected but did not complete initializing. ";

          toast.error(`Session ended: ${reason}`);
          room.disconnect();
        }
      }, 10_000);

      return () => clearTimeout(timeout);
    }
  }, [agentState, sessionStarted, room]);

  return (
    <main
      ref={ref}
      inert={disabled}
      className={cn("relative flex h-full w-full flex-col overflow-hidden")}
    >
      <div className="flex min-h-0 flex-1 flex-col pb-20">
        <div
          className={cn(
            "flex flex-shrink-0 items-center justify-center overflow-hidden px-4",
            chatOpen ? "h-16" : "flex-1",
          )}
        >
          <MediaTiles chatOpen={chatOpen} />
        </div>

        {chatOpen && (
          <div className="mt-4 flex max-h-[65vh] min-h-0 flex-1 flex-col">
            <div
              className={cn(
                "scrollbar-hide flex-1 overflow-y-auto px-4",
                "scroll-smooth",
              )}
              style={{
                scrollbarWidth: "none",
                msOverflowStyle: "none",
              }}
            >
              <div className="mx-auto max-w-[62rem]">
                <ChatRenderer convoMessages={messages} />
              </div>
            </div>
          </div>
        )}
      </div>

      <div className="absolute right-0 bottom-0 left-0 z-10">
        <div className="flex justify-center pb-6">
          <AgentControlBar
            onChatOpenChange={setChatOpen}
            onDisconnect={handleEndCall}
          />
        </div>
      </div>
    </main>
  );
};
