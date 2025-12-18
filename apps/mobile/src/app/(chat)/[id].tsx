/**
 * Dynamic Chat Route - app/(chat)/[id].tsx
 * Handles individual chat sessions with dynamic routing
 * Following Expo Router conventions - logic in app folder, components in features
 */

import { useLocalSearchParams } from "expo-router";
import { useEffect } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import DrawerLayout, {
  DrawerPosition,
  DrawerType,
} from "react-native-gesture-handler/ReanimatedDrawerLayout";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChatEmptyState,
  ChatHeader,
  ChatInput,
  ChatMessage,
  DEFAULT_SUGGESTIONS,
  type Message,
  SIDEBAR_WIDTH,
  SidebarContent,
  useChat,
  useChatContext,
  useSidebar,
} from "@/features/chat";
import { ChatTheme } from "@/shared/constants/chat-theme";

export default function ChatPage() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { activeChatId, setActiveChatId, createNewChat } = useChatContext();

  // Set the active chat from the route parameter
  useEffect(() => {
    if (id && id !== activeChatId) {
      setActiveChatId(id);
    }
  }, [id, activeChatId, setActiveChatId]);

  const { messages, isTyping, flatListRef, sendMessage, scrollToBottom } =
    useChat(activeChatId);

  const { drawerRef, closeSidebar, toggleSidebar } = useSidebar();

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    closeSidebar();
  };

  const handleNewChat = () => {
    createNewChat();
    closeSidebar();
  };

  const renderDrawerContent = () => (
    <SidebarContent
      onClose={closeSidebar}
      onSelectChat={handleSelectChat}
      onNewChat={handleNewChat}
    />
  );

  const renderMessage = ({ item }: { item: Message }) => (
    <ChatMessage message={item} />
  );

  const renderEmpty = () => (
    <ChatEmptyState
      suggestions={DEFAULT_SUGGESTIONS}
      onSuggestionPress={sendMessage}
    />
  );

  return (
    <GestureHandlerRootView style={styles.flex}>
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={SIDEBAR_WIDTH}
        drawerPosition={DrawerPosition.LEFT}
        drawerType={DrawerType.FRONT}
        overlayColor="rgba(0, 0, 0, 0.6)"
        renderNavigationView={renderDrawerContent}
      >
        <KeyboardAvoidingView
          style={styles.container}
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={32}
        >
          <SafeAreaView style={styles.safeArea} edges={["top", "bottom"]}>
            {/* Header */}
            <ChatHeader
              onMenuPress={toggleSidebar}
              onNewChatPress={handleNewChat}
              onSearchPress={() => console.log("Search pressed")}
            />

            {/* Messages List */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View style={styles.messagesContainer}>
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={styles.messagesList}
                  ListEmptyComponent={renderEmpty}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </TouchableWithoutFeedback>

            {/* Bottom Input & Typing Indicator */}
            <View style={styles.bottomContainer}>
              <ChatInput
                placeholder="What can I do for you today?"
              />
              {isTyping && (
                <View style={styles.typingContainer}>
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                  <View style={styles.typingDot} />
                </View>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </DrawerLayout>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    backgroundColor: ChatTheme.background,
  },
  container: {
    flex: 1,
    backgroundColor: ChatTheme.background,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    flexGrow: 1,
    paddingHorizontal: ChatTheme.spacing.md,
  },
  bottomContainer: {
    // Ensures input and typing indicator are at the bottom
    width: '100%',
    backgroundColor: ChatTheme.background,
    paddingBottom: 0, // SafeAreaView already handles safe area
  },
  typingContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: ChatTheme.spacing.md,
    paddingVertical: ChatTheme.spacing.sm,
    gap: ChatTheme.spacing.xs,
  },
  typingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: ChatTheme.accent,
  },
});
