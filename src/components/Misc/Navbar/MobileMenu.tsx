import { Button } from "@heroui/button";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

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
      <SheetContent className="max-w-[250px] border-none bg-zinc-900 text-foreground dark">
        <SheetHeader>
          <SheetTitle>
            <VisuallyHidden.Root>Menu</VisuallyHidden.Root>
          </SheetTitle>
          <SheetDescription className="flex flex-col gap-3 pt-12">
            <Button
              className="flex w-full justify-between"
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
