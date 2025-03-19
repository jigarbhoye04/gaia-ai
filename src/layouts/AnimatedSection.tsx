import { motion, MotionProps } from "framer-motion";
import React, { Children, useMemo, useRef } from "react";

import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";
import { cn } from "@/lib/utils";

interface AnimatedSectionProps
  extends MotionProps,
    Omit<React.HTMLAttributes<HTMLDivElement>, keyof MotionProps> {
  children: React.ReactNode;
  staggerDelay?: number;
  className?: string;
  childClassName?: string; // New prop for span classes
  disableAnimation?: boolean;
}

const STATIC_ITEM_VARIANTS = {
  hidden: { opacity: 0, y: 50 },
  visible: { opacity: 1, y: 0 },
};

const NO_ANIMATION_VARIANTS = {
  visible: { opacity: 1, y: 0 },
};

const AnimatedSectionComponent = ({
  children,
  staggerDelay = 0.2,
  className = "",
  childClassName = "",
  disableAnimation = false,
  ...restProps
}: AnimatedSectionProps) => {
  const ref = useRef<HTMLDivElement>(null);
  const isVisible = useIntersectionObserver(ref, { threshold: 0.1 });

  const containerVariants = useMemo(
    () => ({
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: disableAnimation
          ? {}
          : {
              when: "beforeChildren",
              staggerChildren: staggerDelay,
            },
      },
    }),
    [staggerDelay, disableAnimation],
  );

  return (
    <motion.div
      ref={ref}
      initial={disableAnimation ? "visible" : "hidden"}
      animate={disableAnimation || isVisible ? "visible" : "hidden"}
      variants={containerVariants}
      className={cn(className)}
      style={{ willChange: "transform, opacity" }}
      {...restProps}
    >
      {Children.map(children, (child, index) => {
        const key =
          React.isValidElement(child) && child.key != null ? child.key : index;
        return (
          <motion.span
            key={key}
            variants={
              disableAnimation ? NO_ANIMATION_VARIANTS : STATIC_ITEM_VARIANTS
            }
            style={{ willChange: "transform, opacity" }}
            className={cn(childClassName)}
          >
            {child}
          </motion.span>
        );
      })}
    </motion.div>
  );
};

export const AnimatedSection = React.memo(AnimatedSectionComponent);
