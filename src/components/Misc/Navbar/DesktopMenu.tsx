import { Button } from "@heroui/button";
import Link from "next/link";

import { authNavLinks } from "@/config/navigationConfig";
import { useUser } from "@/hooks/useUser";

export default function DesktopMenu({ scrolled }: { scrolled: boolean }) {
  const user = useUser();
  const isAuthenticated = user && user.email; // Check if user has email to determine auth status

  if (scrolled)
    return (
      <div className="flex items-center gap-1">
        {isAuthenticated ? (
          // Show auth links that require login
          authNavLinks
            .filter((link) => link.requiresAuth)
            .map((link) => (
              <Button
                key={link.href}
                as={Link}
                className="font-medium"
                color="primary"
                endContent={link.icon}
                radius="lg"
                size="md"
                href={link.href}
                variant="shadow-sm"
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
                  color={link.href === "/get-started" ? "primary" : "primary"}
                  radius="lg"
                  size="md"
                  href={link.href}
                  variant={link.href === "/get-started" ? "shadow-sm" : "light"}
                >
                  {link.label}
                </Button>
              ))}
          </>
        )}
      </div>
    );
}
