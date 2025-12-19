/**
 * Sidebar Component
 * Drawer sidebar with chat history using react-native-gesture-handler
 */

import { SafeAreaView } from "react-native-safe-area-context";
import { ChatHistory } from "./chat-history";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";

interface SidebarProps {
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export const SIDEBAR_WIDTH = 260;

export function SidebarContent({
  onClose,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  return (
    <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
      <SidebarHeader onClose={onClose} />
      <ChatHistory onSelectChat={onSelectChat} onNewChat={onNewChat} />
      <SidebarFooter />
    </SafeAreaView>
  );
}


