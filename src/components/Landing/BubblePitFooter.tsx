"use client";

import { motion } from "framer-motion";
import React, {
  ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import {
  SimpleChatBubbleBot,
  SimpleChatBubbleUser,
} from "@/components/Landing/Dummy/SimpleChatBubbles";

// import { Calendaradd } from "@/pages/LoginSignup";

//
// 1. Define an interface that includes position, size, color and the custom component.
//
export interface BubbleConfig {
  x: number;
  y: number;
  size: number;
  // color: string;
  component: ReactNode;
}

//
// 2. Create a ChatBubble component that “wraps” the provided content with motion/drag behavior.
//
export const ChatBubble: React.FC<BubbleConfig> = ({
  x,
  y,
  size,
  // color,
  component,
}) => {
  return (
    <motion.div
      drag
      className="absolute cursor-grab active:cursor-grabbing"
      dragElastic={0.2}
      dragMomentum={false}
      style={{
        x,
        y,
        width: size,
        height: size,

        // (Optional) Use the color for a border or background if you wish:
        // border: `2px solid ${color}`,
      }}
      whileHover={{ scale: 1.1, rotate: 1.5 }}
      whileTap={{ scale: 0.9 }}
    >
      {component}
    </motion.div>
  );
};

//
// 3. Create the container that holds all bubbles.
//    Here we generate bubble configurations with random positions (and sizes/colors) but you also supply the inner component.
//    You can adjust the logic here to suit your needs.
//
const BubblePitFooter: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [bubbles, setBubbles] = useState<BubbleConfig[]>([]);

  // Memoize the components array
  const providedComponents = React.useMemo<ReactNode[]>(
    () => [
      <SimpleChatBubbleBot key="bot" className="text-nowrap">
        hey there!
      </SimpleChatBubbleBot>,
      <SimpleChatBubbleUser key="user" className="text-nowrap">
        Hey GAIA!
      </SimpleChatBubbleUser>,
    ],
    [],
  );

  // Memoize the colors array
  const COLORS = React.useMemo(
    () => ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"],
    [],
  );

  // Move bubble generation logic to a callback
  const generateBubbles = useCallback(() => {
    if (!containerRef.current) return;

    const { width, height } = containerRef.current.getBoundingClientRect();
    const newBubbles: BubbleConfig[] = providedComponents.map((component) => ({
      x: Math.random() * (width - 100),
      y: Math.random() * (height - 100),
      size: 20 + Math.random() * 20,
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      component,
    }));
    setBubbles(newBubbles);
  }, [providedComponents, COLORS]);

  useEffect(() => {
    generateBubbles();
  }, [generateBubbles]);

  // Optional: Update bubble positions on mouse move.
  const handleMouseMove = (event: React.MouseEvent<HTMLDivElement>) => {
    if (!containerRef.current) return;

    const { left, top, width, height } =
      containerRef.current.getBoundingClientRect();
    const mouseX = event.clientX - left;
    const mouseY = event.clientY - top;

    setBubbles((prevBubbles) =>
      prevBubbles.map((bubble) => {
        const dx = mouseX - bubble.x;
        const dy = mouseY - bubble.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        const maxDistance = 1000;

        let newX = bubble.x;
        let newY = bubble.y;

        if (distance < maxDistance && distance !== 0) {
          const force = (maxDistance - distance) / maxDistance;
          const moveX = (dx / distance) * force * 10;
          const moveY = (dy / distance) * force * 10;

          newX = bubble.x - moveX;
          newY = bubble.y - moveY;
        }

        // Keep the bubbles within container bounds.
        if (newX < 0 || newX + bubble.size > width) {
          newX = Math.max(0, Math.min(newX, width - bubble.size - 100));
        }
        if (newY < 0 || newY + bubble.size > height) {
          newY = Math.max(0, Math.min(newY, height - bubble.size - 100));
        }

        return { ...bubble, x: newX, y: newY };
      }),
    );
  };

  return (
    <motion.div
      ref={containerRef}
      className="fixed bottom-0 left-0 z-0 h-screen w-full overflow-hidden"
      onMouseMove={handleMouseMove}
    >
      {bubbles.map((bubble, index) => (
        <ChatBubble key={index} {...bubble} />
      ))}
    </motion.div>
  );
};

export default BubblePitFooter;
