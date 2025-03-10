import { useUser } from "@/hooks/useUser";
import { Button } from "@heroui/button";
import Link from "next/link";
import { BubbleConversationChatIcon } from "@/components/Misc/icons";

export default function DesktopMenu({ scrolled }: { scrolled: boolean }) {
  const user = useUser();

  if (scrolled)
    return (
      <div className="flex items-center gap-1">
        {user.email && user.profilePicture && user.name ? (
          <Button
            as={Link}
            className="font-medium"
            color="primary"
            endContent={
              <BubbleConversationChatIcon color="foreground" width="17" />
            }
            radius="lg"
            size="md"
            href={"/c"}
            variant="shadow"
          >
            Chat
          </Button>
        ) : (
          <>
            <Button
              as={Link}
              className="p-0 px-4 font-semibold"
              color="primary"
              radius="lg"
              size="md"
              href={"/login"}
              variant="light"
            >
              Login
            </Button>
            <Button
              as={Link}
              className="p-0 px-4 font-semibold"
              color="primary"
              radius="lg"
              size="md"
              href={"/get-started"}
              variant="shadow"
            >
              Get Started
            </Button>
          </>
        )}
      </div>
    );
}
