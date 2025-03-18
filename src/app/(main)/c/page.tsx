import type { Metadata } from "next";

import MainChat from "@/components/Chat/MainChat";

export const metadata: Metadata = {
  title: "New Chat",
  description:
    "Start a new conversation with GAIA, your AI assistant designed to help with tasks, answer questions, and boost productivity.",
  openGraph: {
    title: "New Chat",
    siteName: "GAIA - Personal Assistant",
    url: "https://heygaia.io/chat/new",
    type: "website",
    description:
      "Start a new conversation with GAIA, your AI assistant designed to help with tasks, answer questions, and boost productivity.",
    images: ["/landing/screenshot.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "New Chat",
    description:
      "Start a new conversation with GAIA, your AI assistant designed to help with tasks, answer questions, and boost productivity.",
    images: ["/landing/screenshot.webp"],
  },
  keywords: [
    "GAIA",
    "AI Chat",
    "AI Assistant",
    "Chatbot",
    "AI Personal Assistant",
    "Conversational AI",
    "Virtual Assistant",
    "Smart AI",
    "Productivity AI",
  ],
};

export default function CreateNewChatPage() {
  return <MainChat />;
}
