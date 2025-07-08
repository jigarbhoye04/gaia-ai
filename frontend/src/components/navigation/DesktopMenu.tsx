import { Button } from "@heroui/button";
import Link from "next/link";
import GitHubButton from 'react-github-btn'

import { authNavLinks } from "@/config/navigationConfig";
import { useUser } from "@/features/auth/hooks/useUser";
import { siteConfig } from "@/config/siteConfig";

export default function DesktopMenu({ scrolled }: { scrolled: boolean }) {
  const user = useUser();
  const isAuthenticated = user?.email; // Check if user has email to determine auth status

  if (scrolled)
    return (
      
  
      <div className="flex items-center gap-2">
        <div className="relative top-1">
        {siteConfig.githubRepo && <GitHubButton href="https://github.com/heygaia/gaia" data-color-scheme="no-preference: light; light: light; dark: dark;" data-icon="octicon-star" data-size="large" data-show-count="true" aria-label="Star heygaia/gaia on GitHub">Star</GitHubButton>
        }
        </div>
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
                  color={link.href === "/signup" ? "primary" : "primary"}
                  size="md"
                  href={link.href}
                  variant={link.href === "/signup" ? "solid" : "light"}
                >
                  {link.label}
                </Button>
              ))}
          </>
        )}
      </div>
    );
}
