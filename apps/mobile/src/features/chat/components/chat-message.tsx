/**
 * Chat Message Component
 * Displays individual chat messages with different styles for user and AI
 */

import * as Clipboard from "expo-clipboard";
import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Animated,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Copy01Icon,
  HugeiconsIcon,
  PinIcon,
} from "@/components/icons";
import { Text } from "@/components/ui/text";
import type { Message } from "../types";

interface ChatMessageProps {
  message: Message;
}

export function ChatMessage({ message }: ChatMessageProps) {
  const [isPinned, setIsPinned] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.95)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 100,
        friction: 8,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handleCopy = async () => {
    await Clipboard.setStringAsync(message.text);
    Alert.alert("Copied", "Message copied to clipboard");
  };

  const handlePin = () => {
    setIsPinned(!isPinned);
  };

  return (
    <Animated.View
      className={`flex-row my-2 px-4 ${message.isUser ? "justify-end" : "justify-start items-start"}`}
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      {!message.isUser && (
        <Image
          source={require("@/assets/logo/logo.webp")}
          className="w-7 h-7 mr-3 mt-1"
          resizeMode="contain"
        />
      )}

      <View className={`flex-1 ${message.isUser ? "items-end" : "items-start"}`}>
        <View
          className={`px-4 py-2.5 rounded-2xl ${
            message.isUser
              ? "bg-[#00bbff] self-end"
              : "bg-secondary dark:bg-zinc-800 self-start"
          }`}
        >
          <Text
            className={`text-base leading-5 ${
              message.isUser ? "text-black" : "text-foreground"
            }`}
          >
            {message.text}
          </Text>
        </View>

        {!message.isUser && (
          <View className="flex-row mt-1 ml-0.5 gap-2">
            <TouchableOpacity onPress={handlePin} className="p-1 opacity-50" activeOpacity={0.7}>
              <HugeiconsIcon
                icon={PinIcon}
                size={14}
                color={isPinned ? "#00bbff" : "#8e8e93"}
                fill={isPinned ? "#00bbff" : "none"}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={handleCopy} className="p-1 opacity-50" activeOpacity={0.7}>
              <HugeiconsIcon
                icon={Copy01Icon}
                size={14}
                color="#8e8e93"
              />
            </TouchableOpacity>
          </View>
        )}
      </View>
    </Animated.View>
  );
}


