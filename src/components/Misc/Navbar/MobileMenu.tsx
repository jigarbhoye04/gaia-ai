import { Button } from "@heroui/button";
import * as VisuallyHidden from "@radix-ui/react-visually-hidden";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Menu01Icon } from "@/components/Misc/icons";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { authNavLinks, mainNavLinks } from "@/config/navigationConfig";
import { useUser } from "@/hooks/useUser";

export default function MobileMenu() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const user = useUser();
  const isAuthenticated = user && user.email; // Check if user has email to determine auth status
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
            {/* Main navigation links */}
            {mainNavLinks.map((link) => (
              <Button
                key={link.href}
                className="flex w-full justify-between"
                endContent={link.icon}
                color="default"
                as={link.external ? Link : undefined}
                href={link.external ? link.href : undefined}
                onPress={() => {
                  if (!link.external) {
                    router.push(link.href);
                    setSheetOpen(false);
                  }
                }}
              >
                {link.label}
              </Button>
            ))}

            {/* Authentication related links */}
            {isAuthenticated ? (
              // Show auth links that require login
              authNavLinks
                .filter((link) => link.requiresAuth)
                .map((link) => (
                  <Button
                    key={link.href}
                    className="font-medium"
                    color="primary"
                    endContent={link.icon}
                    size="md"
                    variant="shadow"
                    onPress={() => {
                      router.push(link.href);
                      setSheetOpen(false);
                    }}
                  >
                    {link.label}
                  </Button>
                ))
            ) : (
              // Show auth links for guests only
              <>
                {authNavLinks
                  .filter((link) => link.guestOnly)
                  .map((link) => (
                    <Button
                      key={link.href}
                      as={Link}
                      className="p-0 px-4 font-semibold"
                      color="primary"
                      size="md"
                      variant="shadow"
                      href={link.href}
                    >
                      {link.label}
                    </Button>
                  ))}
              </>
            )}
          </SheetDescription>
        </SheetHeader>
      </SheetContent>
    </Sheet>
  );
}
