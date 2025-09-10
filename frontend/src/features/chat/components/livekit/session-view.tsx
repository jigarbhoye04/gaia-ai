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
      className={cn(!chatOpen && "max-h-svh overflow-hidden")}
    >
      {/* Container for chat messages, preserving scroll/spacing classes */}
      <div
        className={cn(
          "mx-auto min-h-svh w-full max-w-2xl px-3 pt-32 pb-40 transition-[opacity,translate] duration-300 ease-out md:px-0 md:pt-36 md:pb-48",
          chatOpen ? "translate-y-0 opacity-100 delay-200" : "translate-y-20 opacity-0"
        )}
      >
        <ChatRenderer convoMessages={messages} />
      </div>

      <MediaTiles chatOpen={chatOpen} />

      <div className="fixed right-0 bottom-0 left-0 z-50 px-3 pt-2 pb-3 md:px-12 md:pb-12">
        <motion.div
          key="control-bar"
          initial={{ opacity: 0, translateY: "100%" }}
          animate={{
            opacity: sessionStarted ? 1 : 0,
            translateY: sessionStarted ? "0%" : "100%",
          }}
          transition={{
            duration: 0.3,
            delay: sessionStarted ? 0.5 : 0,
            ease: "easeOut",
          }}
        >
          <div className="relative z-10 mx-auto w-full max-w-xl">
            <AgentControlBar
              onChatOpenChange={setChatOpen}
              onDisconnect={onEndCall}
            />
          </div>
        </motion.div>
      </div>
    </main>
  );
};
