import { useRef, useState, useEffect } from "react";
import {
  View,
  TextInput,
  Pressable,
  Animated,
} from "react-native";
import { HugeiconsIcon, PlusSignIcon, SentIcon } from "@/components/icons";

export function ChatInput({
  placeholder = "What can I do for you today?",
  onSubmit,
  disabled,
}: {
  placeholder?: string;
  onSubmit?: (value: string) => void;
  disabled?: boolean;
}) {
  const [value, setValue] = useState("");
  const scaleAnim = useRef(new Animated.Value(0.9)).current;

  const canSubmit = value.trim().length > 0;

  useEffect(() => {
    Animated.spring(scaleAnim, {
      toValue: canSubmit ? 1 : 0.9,
      useNativeDriver: true,
    }).start();
  }, [canSubmit]);

  const handleSend = () => {
    if (!canSubmit) return;
    onSubmit?.(value.trim());
    setValue("");
  };

  return (
      <View className="flex-row items-end rounded-3xl bg-zinc-100 dark:bg-zinc-800 px-3 py-2">
        {/* Plus Button */}
        <Pressable className="p-2">
          <HugeiconsIcon
            icon={PlusSignIcon}
            size={22}
            className="text-zinc-500"
          />
        </Pressable>

        {/* Input */}
        <TextInput
          value={value}
          onChangeText={setValue}
          placeholder={placeholder}
          placeholderTextColor="#9ca3af"
          multiline
          editable={!disabled}
          className="flex-1 text-base text-zinc-900 dark:text-white px-2 py-2 max-h-32"
        />

        {/* Send */}
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Pressable
            onPress={handleSend}
            disabled={!canSubmit}
            className={`h-9 w-9 rounded-full items-center justify-center ${
              canSubmit
                ? "bg-[#00bbff]"
                : "bg-zinc-300 dark:bg-zinc-700"
            }`}
          >
            <HugeiconsIcon
              icon={SentIcon}
              size={18}
              className="text-white"
            />
          </Pressable>
        </Animated.View>
      </View>
  );
}
