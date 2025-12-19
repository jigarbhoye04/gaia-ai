/**
 * Chat Header Component
 * Top navigation bar with menu, model selector, and actions
 */

import { useState } from "react";
import { Text, TouchableOpacity, View } from "react-native";
import { HugeiconsIcon } from "@/components/icons";
import {
  ArrowDown01Icon,
  Edit01Icon,
  Menu01Icon,
  Search01Icon,
} from "@/components/icons";
import { AI_MODELS, DEFAULT_MODEL } from "../data/models";
import type { AIModel } from "../types";
import { ModelSelector } from "./model-selector";

interface ChatHeaderProps {
  onMenuPress: () => void;
  onNewChatPress: () => void;
  onSearchPress?: () => void;
  selectedModel?: AIModel;
  onModelChange?: (model: AIModel) => void;
}

export function ChatHeader({
  onMenuPress,
  onNewChatPress,
  onSearchPress,
  selectedModel = DEFAULT_MODEL,
  onModelChange,
}: ChatHeaderProps) {
  const [isModelSelectorVisible, setIsModelSelectorVisible] = useState(false);

  const handleModelSelect = (model: AIModel) => {
    onModelChange?.(model);
  };

  return (
    <View className="flex-row items-center justify-between px-4 py-2.5 border-b border-border bg-background shadow-sm elevation-3">
      <TouchableOpacity
        onPress={onMenuPress}
        className="p-1"
        activeOpacity={0.7}
      >
        <HugeiconsIcon icon={Menu01Icon} size={24} color="#ffffff" />
      </TouchableOpacity>

      <TouchableOpacity
        className="flex-row items-center gap-1 px-2.5 py-1"
        activeOpacity={0.7}
        onPress={() => setIsModelSelectorVisible(true)}
      >
        <Text className="text-base text-foreground font-mono">{selectedModel.name}</Text>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          color="#8e8e93"
        />
      </TouchableOpacity>

      <ModelSelector
        visible={isModelSelectorVisible}
        selectedModel={selectedModel}
        models={AI_MODELS}
        onSelect={handleModelSelect}
        onClose={() => setIsModelSelectorVisible(false)}
      />

      <View className="flex-row gap-1">
        {onSearchPress && (
          <TouchableOpacity
            className="p-1"
            activeOpacity={0.7}
            onPress={onSearchPress}
          >
            <HugeiconsIcon
              icon={Search01Icon}
              size={20}
              color="#ffffff"
            />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          className="p-1"
          onPress={onNewChatPress}
          activeOpacity={0.7}
        >
          <HugeiconsIcon
            icon={Edit01Icon}
            size={20}
            color="#ffffff"
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}


