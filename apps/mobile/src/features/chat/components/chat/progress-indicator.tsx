import { useEffect, useRef, useState } from "react";
import { Animated, View } from "react-native";
import { Text } from "@/components/ui/text";
import { getRelevantThinkingMessage } from "../../utils/playfulThinking";

interface ProgressIndicatorProps {
  message: string | null;
}

interface ThinkingIndicatorProps {
  userMessage?: string;
}

function PulsingDots() {
  const dot1 = useRef(new Animated.Value(0.3)).current;
  const dot2 = useRef(new Animated.Value(0.3)).current;
  const dot3 = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const animate = (dot: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(dot, {
            toValue: 1,
            duration: 400,
            useNativeDriver: true,
          }),
          Animated.timing(dot, {
            toValue: 0.3,
            duration: 400,
            useNativeDriver: true,
          }),
        ])
      );
    };

    const a1 = animate(dot1, 0);
    const a2 = animate(dot2, 150);
    const a3 = animate(dot3, 300);

    a1.start();
    a2.start();
    a3.start();

    return () => {
      a1.stop();
      a2.stop();
      a3.stop();
    };
  }, [dot1, dot2, dot3]);

  return (
    <View className="flex-row items-center gap-1 ml-2">
      <Animated.View style={{ opacity: dot1 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
      <Animated.View style={{ opacity: dot2 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
      <Animated.View style={{ opacity: dot3 }} className="w-1.5 h-1.5 rounded-full bg-primary" />
    </View>
  );
}

export function ThinkingIndicator({ userMessage = "" }: ThinkingIndicatorProps) {
  const [thinkingMessage, setThinkingMessage] = useState(() => 
    getRelevantThinkingMessage(userMessage)
  );

  useEffect(() => {
    // Change the message every 2-3 seconds
    const interval = setInterval(() => {
      setThinkingMessage(getRelevantThinkingMessage(userMessage));
    }, 2000 + Math.random() * 1000);

    return () => clearInterval(interval);
  }, [userMessage]);

  return (
    <View className="flex-row items-start py-2 px-4">
      <View className="flex-row items-center bg-content2 rounded-2xl px-4 py-3">
        <Text className="text-sm text-foreground">{thinkingMessage}</Text>
        <PulsingDots />
      </View>
    </View>
  );
}

export function ProgressIndicator({ message }: ProgressIndicatorProps) {
  if (!message) return null;

  return (
    <View className="flex-row items-start py-2 px-4">
      <View className="flex-row items-center bg-content2 rounded-2xl px-4 py-3">
        <Text className="text-sm text-foreground">{message}</Text>
        <PulsingDots />
      </View>
    </View>
  );
}
