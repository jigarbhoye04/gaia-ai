import { useRouter } from "expo-router";
import { useEffect } from "react";
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Text,
  View,
} from "react-native";
import DrawerLayout, {
  DrawerPosition,
  DrawerType,
} from "react-native-gesture-handler/ReanimatedDrawerLayout";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  ChatHeader,
  ChatMessage,
  type Message,
  SIDEBAR_WIDTH,
  SidebarContent,
  useChat,
  useChatContext,
  useSidebar,
} from "@/features/chat";
import { ChatInput } from "@/components/ui/chat-input";

export default function IndexScreen() {
  const router = useRouter();
  const { setActiveChatId } = useChatContext();
  const { drawerRef, closeSidebar, toggleSidebar } = useSidebar();

  // Use null for new chats - backend will create conversation ID
  const {
    messages,
    isTyping,
    flatListRef,
    sendMessage,
    scrollToBottom,
    pendingRedirect,
    clearPendingRedirect,
  } = useChat(null);

  // Handle redirect when backend returns a conversation ID
  useEffect(() => {
    if (pendingRedirect) {
      clearPendingRedirect();
      router.replace(`/(chat)/${pendingRedirect}`);
    }
  }, [pendingRedirect, clearPendingRedirect, router]);

  useEffect(() => {
    scrollToBottom();
  }, [messages.length, scrollToBottom]);

  const handleSelectChat = (chatId: string) => {
    setActiveChatId(chatId);
    closeSidebar();
    router.push(`/(chat)/${chatId}`);
  };

  const handleNewChat = () => {
    closeSidebar();
  };

  const handleSendMessage = async (text: string) => {
    await sendMessage(text);
  };

  const renderDrawerContent = () => (
    <SidebarContent onSelectChat={handleSelectChat} onNewChat={handleNewChat} />
  );

  return (
    <View className="flex-1">
      <DrawerLayout
        ref={drawerRef}
        drawerWidth={SIDEBAR_WIDTH}
        drawerPosition={DrawerPosition.LEFT}
        drawerType={DrawerType.FRONT}
        overlayColor="rgba(0, 0, 0, 0.7)"
        renderNavigationView={renderDrawerContent}
      >
        <KeyboardAvoidingView
          className="flex-1"
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 0}
        >
          <SafeAreaView style={{ flex: 1 }} edges={["top"]}>
            <ChatHeader
              onMenuPress={toggleSidebar}
              onNewChatPress={handleNewChat}
              onSearchPress={() => console.log("Search pressed")}
            />

            <View className="flex-1">
              {messages.length === 0 ? (
                <View className="flex-1 items-center justify-center px-6">
                  <Text className="text-2xl font-semibold text-foreground mb-2">
                    What can I help you with?
                  </Text>
                  <Text className="text-default-500 text-center">
                    Start a conversation by typing a message below
                  </Text>
                </View>
              ) : (
                <FlatList
                  ref={flatListRef}
                  data={messages}
                  renderItem={({ item }: { item: Message }) => (
                    <ChatMessage message={item} />
                  )}
                  keyExtractor={(item) => item.id}
                  extraData={messages[messages.length - 1]?.text}
                  contentContainerStyle={{
                    flexGrow: 1,
                    paddingTop: 16,
                    paddingBottom: 32,
                  }}
                  showsVerticalScrollIndicator={true}
                  keyboardShouldPersistTaps="handled"
                  initialNumToRender={20}
                  maxToRenderPerBatch={10}
                  windowSize={10}
                  keyboardDismissMode="on-drag"
                  onScrollBeginDrag={Keyboard.dismiss}
                  onContentSizeChange={() => {
                    if (messages.length > 0) {
                      flatListRef.current?.scrollToEnd({ animated: false });
                    }
                  }}
                />
              )}
            </View>

            <View className="px-2 pb-2 bg-surface rounded-t-4xl">
              {isTyping && (
                <View className="flex-row items-center px-2 py-3 gap-2 mb-2">
                  <View className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <View className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                  <View className="w-1.5 h-1.5 rounded-full bg-primary/60" />
                </View>
              )}
              <ChatInput onSend={handleSendMessage} />
            </View>
          </SafeAreaView>
        </KeyboardAvoidingView>
      </DrawerLayout>
    </View>
  );
}
