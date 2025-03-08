import {
    BubbleConversationChatIcon,
    Home01Icon,
    Menu01Icon,
} from "@/components/Misc/icons";
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
    SheetTrigger,
} from "@/components/ui/sheet";
import { useUser } from "@/hooks/useUser";
import { Button } from "@heroui/button";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

type MobileMenuProps = {
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
};

export default function MobileMenu() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const user = useUser();
  const router = useRouter();

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger>
        <div className="rounded-full p-3">
          <Menu01Icon color="foreground" />
        </div>
      </SheetTrigger>
      <SheetContent className="dark text-foreground max-w-[250px] bg-zinc-900 border-none">
        <SheetHeader>
          <SheetTitle>
            <VisuallyHidden.Root>Menu</VisuallyHidden.Root>
          </SheetTitle>
          <SheetDescription className="pt-12 gap-3 flex flex-col">
            <Button
              className="w-full flex justify-between"
              endContent={
                <Home01Icon color="foreground" width="20" height="20" />
              }
              color="default"
              onPress={() => {
                router.push("/");
                setSheetOpen(false);
              }}
            >
              Home
            </Button>

            {user ? (
              <Button
                className="font-medium"
                color="primary"
                endContent={
                  <BubbleConversationChatIcon color="foreground" width="17" />
                }
                radius="full"
                size="md"
                variant="shadow"
                onPress={() => {
                  router.push("/c");
                  setSheetOpen(false);
                }}
              >
                Chat
              </Button>
            ) : (
              <>
                <Button
                  as={Link}
                  className="p-0 px-4 font-semibold"
                  color="primary"
                  size="md"
                  variant="shadow"
                  href={"/login"}
                >
                  Login
                </Button>
                <Button
                  as={Link}
                  className="p-0 px-4 font-semibold"
                  color="primary"
                  size="md"
                  href={"/get-started"}
                  variant="shadow"
                >
                  Get Started
                </Button>
              </>
            )}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
