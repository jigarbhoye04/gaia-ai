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
import { pages } from "../Navbar";

export default function MobileMenu() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const user = useUser();

  return (
    <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
      <SheetTrigger>
        <div className="rounded-full p-3">
          <Menu01Icon color="foreground" />
        </div>
      </SheetTrigger>
      <SheetContent className="dark text-foreground max-w-[250px] bg-zinc-950 border-none">
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
              variant="flat"
              color="default"
              as={Link}
              href={"/"}
              onPress={() => {
                setSheetOpen(false);
              }}
            >
              Home
            </Button>

            {pages.map(({ href, label, icon, external }) => (

              <Button
                className="w-full flex justify-between"
                endContent={icon}
                as={Link}
                href={href}
                variant="flat"
                color="default"
                onPress={() => {
                  // router.push("/");
                  setSheetOpen(false);
                }}
              >
                {label}
              </Button>
            ))}


            {user ? (
              <Button
                className="w-full flex justify-between font-medium"
                color="primary"
                endContent={
                  <BubbleConversationChatIcon color="foreground" width="20" height="20" />
                }
                size="md"
                as={Link}
                href={"/c"}
                variant="shadow"
                onPress={() => {
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
