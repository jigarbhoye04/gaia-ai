/**
 * SidebarHeader Component
 * Logo and menu toggle for sidebar
 */

import { Image, TouchableOpacity, View } from "react-native";
import { ArrowLeft01Icon, HugeiconsIcon } from "@/components/icons";
import { Text } from "@/components/ui/text";

interface SidebarHeaderProps {
  onClose: () => void;
}

export function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-3 border-b border-border bg-background">
      <View className="flex-row items-center gap-3">
        <Image
          source={require("@/assets/logo/logo.webp")}
          className="w-7 h-7"
          resizeMode="contain"
        />
        <Text className="text-xl font-bold tracking-tight text-foreground">GAIA</Text>
      </View>
      <TouchableOpacity onPress={onClose} className="p-1" activeOpacity={0.7}>
        <HugeiconsIcon icon={ArrowLeft01Icon} size={22} color="#ffffff" />
      </TouchableOpacity>
    </View>
  );
}
