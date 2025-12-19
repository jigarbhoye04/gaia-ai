/**
 * ChatEmptyState Component
 * Welcome screen with logo and suggestions
 */

import { Image, ScrollView, View } from "react-native";
import { Text } from "@/components/ui/text";
import type { Suggestion } from "../types";
import { SuggestionCard } from "./suggestion-card";

interface ChatEmptyStateProps {
  suggestions: Suggestion[];
  onSuggestionPress: (text: string) => void;
}

export function ChatEmptyState({
  suggestions,
  onSuggestionPress,
}: ChatEmptyStateProps) {
  return (
    <ScrollView
      className="flex-1"
      contentContainerStyle={{ flexGrow: 1, paddingHorizontal: 24, paddingTop: 64, paddingBottom: 32 }}
      showsVerticalScrollIndicator={false}
    >
      <View className="items-center mb-16">
        <View className="mb-6">
          <Image
            source={require("@/assets/logo/logo.webp")}
            className="w-14 h-14"
            resizeMode="contain"
          />
        </View>
        <Text className="text-[28px] font-semibold text-foreground text-center mb-1">Momentum compounds, web.</Text>
      </View>

      <View className="w-full">
        <Text className="text-base font-medium text-muted-foreground mb-4">Suggestions</Text>
        <View className="flex-row flex-wrap gap-2 justify-between">
          {suggestions.map((suggestion, index) => (
            <SuggestionCard
              key={suggestion.id}
              suggestion={suggestion}
              index={index}
              onPress={onSuggestionPress}
            />
          ))}
        </View>
      </View>
    </ScrollView>
  );
}


