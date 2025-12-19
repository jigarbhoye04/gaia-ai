/**
 * SuggestionCard Component
 * Animated card for chat suggestions with press feedback
 */

import { useEffect, useRef } from "react";
import { Animated, Image, Pressable } from "react-native";
import { Card } from "@/components/ui/card";
import { Text } from "@/components/ui/text";
import type { Suggestion } from "../types";

interface SuggestionCardProps {
  suggestion: Suggestion;
  index: number;
  onPress: (text: string) => void;
}

export function SuggestionCard({
  suggestion,
  index,
  onPress,
}: SuggestionCardProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        delay: index * 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 80,
        friction: 8,
        delay: index * 100,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.95,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      tension: 100,
      friction: 5,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View
      className="w-[48%]"
      style={{
        opacity: fadeAnim,
        transform: [{ scale: scaleAnim }],
      }}
    >
      <Pressable
        onPress={() => onPress(suggestion.text)}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
      >
        <Card className="p-4 min-h-[100px] justify-between gap-2 py-4">
          <Image
            source={{ uri: suggestion.iconUrl }}
            className="w-7 h-7"
            resizeMode="contain"
          />
          <Text className="text-sm text-foreground mt-2 leading-5">
            {suggestion.text}
          </Text>
        </Card>
      </Pressable>
    </Animated.View>
  );
}
