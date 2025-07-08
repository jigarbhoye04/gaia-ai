"use client";

import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import DesktopMenu from "@/components/navigation/DesktopMenu";
import MobileMenu from "@/components/navigation/MobileMenu";
import { LinkButton } from "@/components/shared/LinkButton";
import { appConfig } from "@/config/appConfig";
import useMediaQuery from "@/hooks/ui/useMediaQuery";

import { MainNavigationMenu } from "./NavigationMenu";

export default function Navbar() {
  const pathname = usePathname(); // Get the current route
  const isMobileScreen = useMediaQuery("(max-width: 600px)");
  const [scrolled, setScrolled] = useState(true);

  return (
    <div className="navbar">
      <div
        className={`navbar_content mt-3 flex h-full w-full min-w-fit justify-between rounded-xl bg-zinc-900 px-1.5 py-1 !transition-all duration-1000 ${
          (!isMobileScreen && scrolled) || pathname !== "/"
            ? "sm:max-w-(--breakpoint-lg)"
            : "sm:max-w-[50px]"
        }`}
      >
        <Button
          as={Link}
          radius="full"
          href={"/"}
          variant="light"
          onPress={() => setScrolled(true)}
          isIconOnly
        >
          <Image
            src="/branding/logo.webp"
            alt="GAIA Logo"
            width={30}
            height={30}
          />
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {appConfig.links.main
            .filter((link) => link.href !== "/") // Filter out Home link for desktop nav
            .map(({ href, label, icon, external }) => (
              <LinkButton
                key={href}
                size="sm"
                className={`text-sm font-medium ${
                  pathname === href
                    ? "text-primary"
                    : "text-zinc-400 hover:text-zinc-300"
                }`}
                as={Link}
                href={href}
                startContent={icon}
                external={external}
              >
                {label}
              </LinkButton>
            ))}
        </div>

        {isMobileScreen ? (
          <MobileMenu />
        ) : (
          <>
            <MainNavigationMenu />
            <DesktopMenu scrolled={scrolled} />
          </>
        )}
      </div>
    </div>
  );
}
