/**
 * Sidebar Footer Component
 * User info and support section for sidebar
 */

import {
  ActivityIndicator,
  Image,
  TouchableOpacity,
  View,
} from "react-native";
import {
  ArrowDown01Icon,
  HugeiconsIcon,
  InformationCircleIcon,
} from "@/components/icons";
import { useAuth } from "@/features/auth";
import { Text } from "@/components/ui/text";

export function SidebarFooter() {
  const { user, isLoading, signOut } = useAuth();

  const handleUserPress = () => {
    // TODO: Open user menu with more options
    signOut();
  };

  // Get user initials for avatar fallback
  const getInitials = (name?: string) => {
    if (!name) return "U";
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[parts.length - 1][0]}`.toUpperCase();
    }
    return name[0].toUpperCase();
  };

  // Generate avatar color based on email
  const getAvatarColor = (email?: string) => {
    if (!email) return "#00aa88";
    const colors = [
      "#00aa88",
      "#0088cc",
      "#8855cc",
      "#cc5588",
      "#cc8855",
      "#55cc88",
    ];
    const hash = email
      .split("")
      .reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return colors[hash % colors.length];
  };

  if (isLoading) {
    return (
      <View className="border-t border-border py-2">
        <View className="py-6 items-center justify-center">
          <ActivityIndicator size="small" color="#00bbff" />
        </View>
      </View>
    );
  }

  return (
    <View className="border-t border-border/20 py-3 bg-surface-0">
      {/* Need Support */}
      <TouchableOpacity className="flex-row items-center px-6 py-3 gap-3" activeOpacity={0.7}>
        <HugeiconsIcon
          icon={InformationCircleIcon}
          size={20}
          color="#8e8e93"
        />
        <Text className="text-foreground text-sm font-medium">Need Support?</Text>
      </TouchableOpacity>

      {/* User Info */}
      <TouchableOpacity className="flex-row items-center px-6 py-3 gap-3" onPress={handleUserPress} activeOpacity={0.7}>
        {user?.picture ? (
          <Image source={{ uri: user.picture }} className="w-8 h-8 rounded-full" />
        ) : (
          <View
            className="w-8 h-8 rounded-full justify-center items-center"
            style={{ backgroundColor: getAvatarColor(user?.email) }}
          >
            <Text className="text-white text-xs font-bold">{getInitials(user?.name)}</Text>
          </View>
        )}
        <View className="flex-1">
          <Text className="text-foreground text-sm font-semibold" numberOfLines={1}>
            {user?.name || "User"}
          </Text>
          <Text className="text-muted-foreground text-[9px] uppercase font-bold tracking-[0.15em] opacity-60">GAIA Free</Text>
        </View>
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          size={16}
          color="#8e8e93"
        />
      </TouchableOpacity>
    </View>
  );
}


