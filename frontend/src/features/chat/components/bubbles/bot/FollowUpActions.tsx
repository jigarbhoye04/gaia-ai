import { Button } from "@heroui/button";
import { useParams } from "next/navigation";

import { useLoading } from "@/features/chat/hooks/useLoading";
import { useSendMessage } from "@/features/chat/hooks/useSendMessage";
import { motion } from "framer-motion";

interface FollowUpActionsProps {
  actions: string[];
  loading: boolean;
}

export default function FollowUpActions({
  actions,
  loading,
}: FollowUpActionsProps) {
  const { id: convoIdParam } = useParams<{ id: string }>();
  const sendMessage = useSendMessage(convoIdParam ?? null);

  const handleActionClick = async (action: string) => {
    if (loading) return;

    try {
      // Send the follow-up action as a message
      await sendMessage(
        action,
        [], // No file data
        null, // No selected tool
        null, // No tool category
      );
    } catch (error) {
      console.error("Failed to send follow-up action:", error);
    }
  };

  if (!actions || actions.length === 0 || loading) {
    return null;
  }

  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        visible: {
          transition: {
            staggerChildren: 0.05,
          },
        },
      }}
      className="flex max-w-xl flex-wrap gap-2 px-1 pt-3 pb-1"
    >
      {actions.map((action, index) => (
        <motion.div
          key={index}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0 },
          }}
        >
          <Button
            className="text-xs text-foreground-500 transition-colors hover:bg-zinc-700 hover:text-foreground-700"
            variant="flat"
            size="sm"
            onPress={() => handleActionClick(action)}
            isDisabled={loading}
          >
            {action}
          </Button>
        </motion.div>
      ))}
    </motion.div>
  );
}
