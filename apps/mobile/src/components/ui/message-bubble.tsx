import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import { useEffect, useRef } from "react";
import type * as React from "react";
import { View, Pressable, Animated } from "react-native";
import { Text } from "@/components/ui/text";
import { Avatar } from "heroui-native";
import {
  HugeiconsIcon,
  ThumbsUpIcon,
  ThumbsDownIcon,
  Pin02Icon,
  Message01Icon,
  Copy01Icon,
} from "@/components/icons";

const GaiaLogo = require("@/../assets/logo/gaia.png");

const messageBubbleVariants = cva("px-4 py-2.5 max-w-[100%]", {
  variants: {
    variant: {
      sent: "bg-accent self-end rounded-2xl rounded-br-md",
      received: "bg-surface self-start rounded-2xl rounded-bl-md",
      loading: "bg-transparent self-start",
    },
    grouped: {
      none: "",
      first: "mb-1 rounded-2xl",
      middle: "mb-1 rounded-xl",
      last: "",
    },
  },
  compoundVariants: [
    {
      variant: "sent",
      grouped: "first",
      className: "rounded-br-md",
    },
    {
      variant: "sent",
      grouped: "middle",
      className: "rounded-r-md",
    },
    {
      variant: "sent",
      grouped: "last",
      className: "rounded-tr-md",
    },
    {
      variant: "received",
      grouped: "first",
      className: "rounded-bl-md",
    },
    {
      variant: "received",
      grouped: "middle",
      className: "rounded-l-md",
    },
    {
      variant: "received",
      grouped: "last",
      className: "rounded-tl-md",
    },
  ],
  defaultVariants: {
    variant: "received",
    grouped: "none",
  },
});

type MessageBubbleVariantProps = VariantProps<typeof messageBubbleVariants>;

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

interface MessageBubbleProps
  extends
    React.ComponentPropsWithoutRef<typeof View>,
    MessageBubbleVariantProps {
  message?: string;
}

function MessageBubble({
  message,
  variant = "received",
  grouped = "none",
  className,
  children,
  ...props
}: MessageBubbleProps) {
  const isLoading = variant === "loading";
  const displayVariant = isLoading ? "received" : variant;

  return (
    <View
      className={cn(
        "flex-row gap-2",
        displayVariant === "received" ? "self-start" : "self-end"
      )}
    >
      {displayVariant === "received" && (
        <Avatar
          alt="Gaia"
          size="sm"
          color="default"
          style={{ width: 24, height: 24 }}
        >
          <Avatar.Image source={GaiaLogo} />
          <Avatar.Fallback>G</Avatar.Fallback>
        </Avatar>
      )}
      <View className={cn("flex-col", displayVariant === "received" ? "flex-1" : "")}>
        <View
          className={cn(
            isLoading ? "px-0 py-2.5" : messageBubbleVariants({ variant: displayVariant, grouped }),
            className
          )}
          {...props}
        >
          {children || (
            isLoading ? (
              <View className="flex-row items-center">
                <Text className="text-base text-foreground">{message}</Text>
                <PulsingDots />
              </View>
            ) : (
              <Text
                className={cn(
                  "text-base",
                  variant === "sent"
                    ? "text-accent-foreground"
                    : "text-foreground"
                )}
              >
                {message}
              </Text>
            )
          )}
        </View>
        {displayVariant === "received" && !isLoading && (
          <View className="flex-row items-center gap-3 mt-1.5 px-1">
            <Pressable className="p-1 active:opacity-60">
              <HugeiconsIcon icon={Copy01Icon} size={16} color="#8e8e93" />
            </Pressable>
            <Pressable className="p-1 active:opacity-60">
              <HugeiconsIcon icon={ThumbsUpIcon} size={16} color="#8e8e93" />
            </Pressable>
            <Pressable className="p-1 active:opacity-60">
              <HugeiconsIcon icon={ThumbsDownIcon} size={16} color="#8e8e93" />
            </Pressable>
            <Pressable className="p-1 active:opacity-60">
              <HugeiconsIcon icon={Pin02Icon} size={16} color="#8e8e93" />
            </Pressable>
            <Pressable className="p-1 active:opacity-60">
              <HugeiconsIcon icon={Message01Icon} size={16} color="#8e8e93" />
            </Pressable>
          </View>
        )}
      </View>
    </View>
  );
}

interface ChatMessageProps {
  timestamp?: string;
  messages: string[];
  variant?: "sent" | "received";
  className?: string;
  showTimestamp?: boolean;
}

function ChatMessage({
  timestamp,
  messages,
  variant = "received",
  className,
  showTimestamp = true,
}: ChatMessageProps) {
  const hasMultipleMessages = messages.length > 1;

  const getGroupedType = (
    index: number,
    total: number
  ): "first" | "middle" | "last" | "none" => {
    if (total === 1) return "none";
    if (index === 0) return "first";
    if (index === total - 1) return "last";
    return "middle";
  };

  return (
    <View
      className={cn(
        "flex w-full flex-col",
        variant === "sent" ? "items-end" : "items-start",
        className
      )}
    >
      <View className="flex flex-col">
        {messages.map((message, index) => (
          <MessageBubble
            key={`${message.slice(0, 20)}-${index}`}
            message={message}
            variant={variant}
            grouped={
              hasMultipleMessages
                ? getGroupedType(index, messages.length)
                : "none"
            }
          />
        ))}
      </View>

      {showTimestamp && timestamp && (
        <Text
          className={cn(
            "mt-1 px-2 text-xs text-muted",
            variant === "sent" && "text-right"
          )}
        >
          {timestamp}
        </Text>
      )}
    </View>
  );
}

export { MessageBubble, ChatMessage, messageBubbleVariants };
export type { MessageBubbleProps, MessageBubbleVariantProps, ChatMessageProps };
