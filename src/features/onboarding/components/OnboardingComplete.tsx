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
        onPress={onLetsGo}
        color="primary"
        size="lg"
        radius="full"
        className="font-medium transition-transform duration-400 hover:scale-125 hover:bg-primary/90"
      >
        <span className="flex items-center gap-2">Let's Go!</span>
      </Button>
    </motion.div>
  );
};
