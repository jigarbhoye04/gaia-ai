/**
 * SidebarHeader Component
 * Logo and menu toggle for sidebar
 */

import { Image, TextInput, TouchableOpacity, View } from "react-native";
import {
  PencilEdit02Icon,
  HugeiconsIcon,
  Search01Icon,
} from "@/components/icons";
import { Text } from "@/components/ui/text";

interface SidebarHeaderProps {
  onNewChat: () => void;
}

export function SidebarHeader({ onNewChat }: SidebarHeaderProps) {
  return (
    <View className="px-5 py-4 pt-6 bg-sidebar">
      {/* Brand Header */}
      <View className="flex-row items-center gap-2 mb-5 px-1">
        <Image
          source={require("@/assets/logo/logo.webp")}
          className="w-7 h-7"
          resizeMode="contain"
        />
        <Text className="text-xl font-bold tracking-tight text-foreground">GAIA</Text>
      </View>

      <View className="flex-row items-center gap-3">
        {/* Search Bar */}
        <View className="flex-1 flex-row items-center bg-secondary/30 rounded-xl px-3 h-10 border border-border/50">
          <HugeiconsIcon icon={Search01Icon} size={18} color="#8e8e93" />
          <TextInput
            className="flex-1 ml-2 text-foreground text-sm"
            placeholder="Search"
            placeholderTextColor="#8e8e93"
          />
        </View>

        {/* New Chat Button */}
        <TouchableOpacity
          onPress={onNewChat}
          className="h-10 w-10 items-center justify-center rounded-xl bg-secondary/30 border border-border/50"
          activeOpacity={0.7}
        >
          <HugeiconsIcon icon={PencilEdit02Icon} size={20} color="#ffffff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}
