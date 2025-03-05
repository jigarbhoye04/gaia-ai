import { cn } from "@/lib/utils";
import React, { Children } from "react";
// import { motion } from "framer-motion";
// import { useIntersectionObserver } from "@/hooks/useIntersectionObserver";

interface AnimatedSectionProps {
  children: React.ReactNode;
  // staggerDelay?: number;
  className?: string;
}

export function AnimatedSection({
  children,
  // staggerDelay = 0.2,
  className = "",
}: AnimatedSectionProps) {
  // const ref = useRef(null);
  // const isVisible = useIntersectionObserver(ref);

  // // Memoize variants to prevent unnecessary recalculations
  // const containerVariants = useMemo(
  //   () => ({
  //     hidden: { opacity: 0 },
  //     visible: {
  //       opacity: 1,
  //       transition: {
  //         when: "beforeChildren",
  //         staggerChildren: staggerDelay,
  //       },
  //     },
  //   }),
  //   [staggerDelay]
  // );

  // const itemVariants = useMemo(
  //   () => ({
  //     hidden: { opacity: 0, y: 50 },
  //     visible: { opacity: 1, y: 0 },
  //   }),
  //   []
  // );

  return (
    // <motion.div
    //   ref={ref}
    //   animate={isVisible ? "visible" : "hidden"}
    // className={cn(className)}
    //   initial="hidden"
    //   variants={containerVariants}
    // >
    <div className={cn(className)}>
      {/* // <motion.div key={index} variants={itemVariants}> */}
      {Children.map(children, (child, index) => (
        <div key={index}>{child}</div>
      ))}
      {/* // </motion.div> */}
    </div>
    // {/* </motion.div> */}
  );
}
