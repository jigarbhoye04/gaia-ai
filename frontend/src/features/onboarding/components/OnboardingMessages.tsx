import { motion } from "framer-motion";

import {
  SimpleChatBubbleBot,
  SimpleChatBubbleUser,
} from "@/features/landing/components/demo/SimpleChatBubbles";

import { Message } from "../types";

interface OnboardingMessagesProps {
  messages: Message[];
  messagesEndRef: React.RefObject<HTMLDivElement | null>;
}

export const OnboardingMessages = ({
  messages,
  messagesEndRef,
}: OnboardingMessagesProps) => {
  return (
    <>
      {messages.map((message, index) => (
        <motion.div
          key={message.id}
          className="mb-4"
          initial={{ opacity: 0, y: 15 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{
            duration: 0.4,
            ease: "easeOut",
            delay: index * 0.05,
          }}
        >
          {message.type === "bot" ? (
            <SimpleChatBubbleBot>{message.content}</SimpleChatBubbleBot>
          ) : (
            <SimpleChatBubbleUser>{message.content}</SimpleChatBubbleUser>
          )}
        </motion.div>
      ))}
      <div ref={messagesEndRef} />
    </>
  );
};
