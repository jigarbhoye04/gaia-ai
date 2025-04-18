"use client";

import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { mainNavLinks } from "@/config/navigationConfig";
import { siteConfig } from "@/config/siteConfig";
import useMediaQuery from "@/hooks/useMediaQuery";

import { LinkButton } from "./LinkButton";
import DesktopMenu from "./Navbar/DesktopMenu";
import MobileMenu from "./Navbar/MobileMenu";

export default function Navbar() {
  const pathname = usePathname(); // Get the current route
  const isMobileScreen = useMediaQuery("(max-width: 600px)");
  const [scrolled, setScrolled] = useState(true);

  return (
    <div className="navbar">
      <div
        className={`navbar_content w-full min-w-fit rounded-2xl bg-zinc-950/60 backdrop-blur-lg !transition-all duration-1000 ${
          (!isMobileScreen && scrolled) || pathname !== "/"
            ? "sm:max-w-(--breakpoint-xl)"
            : "sm:max-w-[50px]"
        }`}
      >
        <Button
          as={Link}
          className="group pr-3 pl-2 text-lg font-medium"
          radius="lg"
          href={"/"}
          variant="light"
          onPress={() => setScrolled(true)}
          startContent={
            <Image
              src="/branding/logo.webp"
              alt="GAIA Logo"
              width={30}
              height={30}
            />
          }
        >
          <div className="-translate-x-7 opacity-0 transition-all duration-200 group-hover:translate-x-0 group-hover:opacity-100">
            {siteConfig.name}
          </div>
        </Button>

        <div className="hidden items-center gap-1 sm:flex">
          {mainNavLinks
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

        {isMobileScreen ? <MobileMenu /> : <DesktopMenu scrolled={scrolled} />}
      </div>
    </div>
  );
}
