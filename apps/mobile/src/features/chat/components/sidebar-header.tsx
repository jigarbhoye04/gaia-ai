/**
 * SidebarHeader Component
 * Logo and menu toggle for sidebar
 */

import { ChatTheme } from '@/shared/constants/chat-theme';
import { Ionicons } from '@expo/vector-icons';
import React from 'react';
import { Image, TouchableOpacity, View } from 'react-native';
import { Text } from '@/components/ui/text';

interface SidebarHeaderProps {
  onClose: () => void;
}

export function SidebarHeader({ onClose }: SidebarHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-4 py-4 border-b border-border">
      <View className="flex-row items-center gap-2">
        <Image
          source={require('@/assets/logo/logo.webp')}
          className="w-8 h-8"
          resizeMode="contain"
        />
        <Text className="text-lg font-bold">
          GAIA
        </Text>
      </View>
      <TouchableOpacity onPress={onClose} className="p-1">
        <Ionicons name="chevron-back" size={24} color={ChatTheme.textPrimary} />
      </TouchableOpacity>
    </View>
  );
}
