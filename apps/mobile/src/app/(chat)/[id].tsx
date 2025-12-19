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
  SidebarContent,
  useChat,
  useChatContext,
  useSidebar,
} from "@/features/chat";

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
    <GestureHandlerRootView className="flex-1">
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={280}
        drawerPosition={DrawerPosition.LEFT}
        drawerType={DrawerType.FRONT}
        overlayColor="rgba(0, 0, 0, 0.6)"
        renderNavigationView={renderDrawerContent}
      >
        <KeyboardAvoidingView
          className="flex-1 bg-background"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={32}
        >
          <SafeAreaView className="flex-1 bg-background" edges={["top", "bottom"]}>
            {/* Header */}
            <ChatHeader
              onMenuPress={toggleSidebar}
              onNewChatPress={handleNewChat}
              onSearchPress={() => console.log("Search pressed")}
            />

            {/* Messages List */}
            <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
              <View className="flex-1">
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={renderMessage}
                  keyExtractor={(item) => item.id}
                  contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 16 }}
                  ListEmptyComponent={renderEmpty}
                  showsVerticalScrollIndicator={false}
                  keyboardShouldPersistTaps="handled"
                />
              </View>
            </TouchableWithoutFeedback>

            {/* Bottom Input & Typing Indicator */}
            <View className="w-full bg-background">
              <ChatInput
                placeholder="What can I do for you today?"
              />
              {isTyping && (
                <View className="flex-row items-center px-4 py-2 gap-1">
                  <View className="w-2 h-2 rounded-full bg-accent" />
                  <View className="w-2 h-2 rounded-full bg-accent" />
                  <View className="w-2 h-2 rounded-full bg-accent" />
                </View>
              )}
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </DrawerLayout>
    </GestureHandlerRootView>
  );
}


