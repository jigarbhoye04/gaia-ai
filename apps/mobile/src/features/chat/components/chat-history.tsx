/**
 * Chat History Component
 * Displays list of past chat sessions grouped by time
 */

import { Ionicons } from "@expo/vector-icons";
import { useState } from "react";
import { ScrollView, Text, TouchableOpacity, View } from "react-native";
import { ChatTheme } from "@/shared/constants/chat-theme";
import { useChatContext } from "../hooks/use-chat-context";

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: Date;
  isStarred?: boolean;
}

interface ChatHistoryProps {
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

interface CategorySectionProps {
  title: string;
  items: ChatHistoryItem[];
  isExpanded: boolean;
  onToggle: () => void;
  onSelectChat: (chatId: string) => void;
  activeChatId: string | null;
}

// Mock data - replace with actual chat history
const starredChats: ChatHistoryItem[] = [
  {
    id: "s1",
    title: "this is random chat",
    timestamp: new Date(),
    isStarred: true,
  },
];

const todayChats: ChatHistoryItem[] = [
  { id: "t1", title: "Greeting message", timestamp: new Date() },
];

const yesterdayChats: ChatHistoryItem[] = [
  { id: "y1", title: "Greeting message", timestamp: new Date() },
];

const allTimeChats: ChatHistoryItem[] = [
  { id: "a1", title: "Casual greeting", timestamp: new Date() },
  { id: "a2", title: "hello message text", timestamp: new Date() },
  { id: "a3", title: "hello message example", timestamp: new Date() },
  { id: "a4", title: "General greeting", timestamp: new Date() },
  { id: "a5", title: "General greeting message re", timestamp: new Date() },
  { id: "a6", title: "this is random chat", timestamp: new Date() },
];

function CategorySection({
  title,
  items,
  isExpanded,
  onToggle,
  onSelectChat,
  activeChatId,
}: CategorySectionProps) {
  return (
    <View className="mb-2">
      <TouchableOpacity
        className="flex-row justify-between items-center px-4 py-2"
        onPress={onToggle}
      >
        <Text className="text-gray-400 text-sm font-medium">{title}</Text>
        <Ionicons
          name={isExpanded ? "chevron-up" : "chevron-down"}
          size={16}
          color={ChatTheme.textSecondary}
        />
      </TouchableOpacity>

      {isExpanded &&
        items.map((item) => {
          const isActive = item.id === activeChatId;
          return (
            <TouchableOpacity
              key={item.id}
              className={`flex-row items-center px-4 py-2 gap-2 ${isActive ? "bg-gray-800/50 border-l-3 border-l-purple-500" : ""}`}
              onPress={() => onSelectChat(item.id)}
            >
              <Ionicons
                name={item.isStarred ? "star" : "chatbubble-outline"}
                size={16}
                color={isActive ? ChatTheme.accent : ChatTheme.textSecondary}
              />
              <Text
                className={`flex-1 text-base ${isActive ? "text-purple-500 font-semibold" : "text-white"}`}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          );
        })}
    </View>
  );
}

export function ChatHistory({ onSelectChat, onNewChat }: ChatHistoryProps) {
  const { activeChatId } = useChatContext();
  const [expandedSections, setExpandedSections] = useState({
    starred: true,
    today: true,
    yesterday: true,
    allTime: true,
  });

  const toggleSection = (section: keyof typeof expandedSections) => {
    setExpandedSections((prev) => ({ ...prev, [section]: !prev[section] }));
  };

  return (
    <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
      {/* New Chat Button */}
      <TouchableOpacity
        className="flex-row items-center justify-center p-3 mx-4 mt-4 mb-4 bg-purple-500 rounded-xl shadow-lg"
        onPress={onNewChat}
      >
        <Ionicons name="add" size={18} color={ChatTheme.background} />
        <Text className="text-white text-base ml-2 font-semibold">
          New Chat
        </Text>
      </TouchableOpacity>

      {/* Starred Chats */}
      {starredChats.length > 0 && (
        <CategorySection
          title="Starred Chats"
          items={starredChats}
          isExpanded={expandedSections.starred}
          onToggle={() => toggleSection("starred")}
          onSelectChat={onSelectChat}
          activeChatId={activeChatId}
        />
      )}

      {/* Today */}
      {todayChats.length > 0 && (
        <CategorySection
          title="Today"
          items={todayChats}
          isExpanded={expandedSections.today}
          onToggle={() => toggleSection("today")}
          onSelectChat={onSelectChat}
          activeChatId={activeChatId}
        />
      )}

      {/* Yesterday */}
      {yesterdayChats.length > 0 && (
        <CategorySection
          title="Yesterday"
          items={yesterdayChats}
          isExpanded={expandedSections.yesterday}
          onToggle={() => toggleSection("yesterday")}
          onSelectChat={onSelectChat}
          activeChatId={activeChatId}
        />
      )}

      {/* All Time */}
      {allTimeChats.length > 0 && (
        <CategorySection
          title="All time"
          items={allTimeChats}
          isExpanded={expandedSections.allTime}
          onToggle={() => toggleSection("allTime")}
          onSelectChat={onSelectChat}
          activeChatId={activeChatId}
        />
      )}
    </ScrollView>
  );
}
