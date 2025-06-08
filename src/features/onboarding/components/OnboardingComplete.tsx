import { Button } from "@heroui/button";
import { motion } from "framer-motion";

interface OnboardingCompleteProps {
  onLetsGo: () => void;
}

export const OnboardingComplete = ({ onLetsGo }: OnboardingCompleteProps) => {
  return (
    <motion.div
      className="mx-auto w-full max-w-2xl text-center"
      initial={{ opacity: 0, scale: 0.9, y: 15 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      transition={{
        duration: 0.5,
        ease: "easeOut",
        delay: 0.2,
      }}
    >
      <Button
        onClick={onLetsGo}
        color="primary"
        size="lg"
        radius="full"
        className="relative px-12 py-4 text-lg font-bold shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/40"
      >
        <span className="flex items-center gap-2">
          Let's Go
          <motion.span
            animate={{ x: [0, 4, 0] }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          >
            🚀
          </motion.span>
        </span>
      </Button>
    </motion.div>
  );
};
