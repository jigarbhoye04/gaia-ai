import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { LinkButton } from "@/components/shared/LinkButton";
import { siteConfig } from "@/config/siteConfig";
import { useUser } from "@/features/auth/hooks/useUser";

export default function Footer() {
  const user = useUser();
  const isAuthenticated = user?.email;

  return (
    <div className="m-0!">
      <div className="flex h-fit w-screen items-center justify-center p-5 sm:p-20 sm:pb-5">
        <div className="grid w-full max-w-(--breakpoint-lg) grid-cols-2 gap-8 sm:grid-cols-5">
          <div className="flex h-full w-fit flex-col gap-1 text-foreground-600">
            <Image
              src="/branding/logo.webp"
              alt="GAIA Logo"
              width={40}
              height={40}
            />
            <div className="mt-2 text-2xl font-medium text-white">
              {siteConfig.name}
            </div>
            <div className="flex flex-col gap-2 text-xs text-foreground-400">
              <div>{siteConfig.copyright}</div>
            </div>
          </div>

          {siteConfig.pageSections.map((section) => (
            <div
              key={section.title}
              className="flex h-full w-fit flex-col text-foreground-500"
            >
              <div className="mb-3 pl-2 text-sm text-foreground">
                {section.title}
              </div>
              {section.links
                .filter(
                  (link) =>
                    !link.isLoggedIn || (link.isLoggedIn && isAuthenticated),
                )
                .map((link) => (
                  <div key={link.href}>
                    <LinkButton
                      href={link.href}
                      className="group relative flex items-center justify-start text-white"
                    >
                      <span className="text-foreground-400 transition-colors group-hover:text-foreground">
                        {link.label}
                      </span>
                      <span className="ml-1 -translate-x-10 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                        <ArrowUpRight width={17} />
                      </span>
                    </LinkButton>
                  </div>
                ))}
            </div>
          ))}
        </div>
      </div>
      <div className="flex w-full items-center justify-center py-10">
        <iframe
          src="https://status.heygaia.io/badge?theme=dark"
          width="200"
          height="40"
          scrolling="no"
          style={{ colorScheme: "normal" }}
        />
      </div>
    </div>
  );
}
