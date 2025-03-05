import { useUser } from "@/contexts/UserContext";
import useMediaQuery from "@/hooks/mediaQuery";
import { Button } from "@heroui/button";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/router";

import {
  BubbleConversationChatIcon,
  Home01Icon,
  Menu01Icon,
} from "../Misc/icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";

type MobileMenuProps = {
  user: any;
  navigate: any;
  sheetOpen: boolean;
  setSheetOpen: (open: boolean) => void;
};

function MobileMenu({
  user,
  navigate,
  sheetOpen,
  setSheetOpen,
}: MobileMenuProps) {
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
                navigate("/");
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
                  navigate("/c");
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
                  to={"/login"}
                >
                  Login
                </Button>
                <Button
                  as={Link}
                  className="p-0 px-4 font-semibold"
                  color="primary"
                  size="md"
                  to={"/get-started"}
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

type DesktopMenuProps = {
  user: any;
  scrolled: boolean;
};

function DesktopMenu({ user, scrolled }: DesktopMenuProps) {
  if (scrolled)
    return (
      <div className="flex items-center gap-1">
        {user ? (
          <Button
            as={Link}
            className="font-medium"
            color="primary"
            endContent={
              <BubbleConversationChatIcon color="foreground" width="17" />
            }
            radius="full"
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
              radius="full"
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
              radius="full"
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

export default function Navbar() {
  const { user } = useUser();
  const router = useRouter();
  const isMobileScreen = useMediaQuery("(max-width: 600px)");
  const [sheetOpen, setSheetOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
        window.removeEventListener("scroll", handleScroll);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div className="navbar">
      <div
        className={`navbar_content bg-zinc-950 outline-[1px] outline outline-zinc-900 !transition-all w-full min-w-fit duration-1000 ${
          (!isMobileScreen && scrolled) || location.pathname != "/"
            ? "sm:max-w-screen-xl"
            : "sm:max-w-[50px]"
        }`}
      >
        <Button
          as={Link}
          className="text-xl font-medium"
          radius="full"
          size="md"
          href={"/"}
          variant="light"
          onPress={() => setScrolled(true)}
        >
          gaia
        </Button>

        {isMobileScreen ? (
          <MobileMenu
            user={user}
            navigate={router.push}
            sheetOpen={sheetOpen}
            setSheetOpen={setSheetOpen}
          />
        ) : (
          <DesktopMenu user={user} scrolled={scrolled} />
        )}
      </div>
    </div>
  );
}
