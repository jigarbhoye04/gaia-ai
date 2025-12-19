/**
 * Sidebar Component
 * Drawer sidebar with chat history using react-native-gesture-handler
 */

import { StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { ChatTheme } from "@/shared/constants/chat-theme";
import { ChatHistory } from "./chat-history";
import { SidebarFooter } from "./sidebar-footer";
import { SidebarHeader } from "./sidebar-header";

interface SidebarProps {
  onClose: () => void;
  onSelectChat: (chatId: string) => void;
  onNewChat: () => void;
}

export const SIDEBAR_WIDTH = 280;

export function SidebarContent({
  onClose,
  onSelectChat,
  onNewChat,
}: SidebarProps) {
  return (
    <SafeAreaView style={styles.sidebar} edges={["top", "bottom"]}>
      <SidebarHeader onClose={onClose} />
      <ChatHistory onSelectChat={onSelectChat} onNewChat={onNewChat} />
      <SidebarFooter />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    height: '100%',
    backgroundColor: ChatTheme.background,
  },
});
