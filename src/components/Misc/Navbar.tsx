"use client";

import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";

import { siteConfig } from "@/config/siteConfig";
import useMediaQuery from "@/hooks/useMediaQuery";

import { BookOpen02Icon, GlobalIcon, Idea01Icon, MapsIcon } from "./icons";
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
            ? "sm:max-w-screen-xl"
            : "sm:max-w-[50px]"
        }`}
      >
        <Button
          as={Link}
          className="pl-2 pr-3 text-lg font-medium"
          radius="lg"
          href={"/"}
          variant="light"
          onPress={() => setScrolled(true)}
          startContent={
            <Image
              src="/branding/logo.webp"
              alt="GAIA Logo"
              width={25}
              height={25}
            />
          }
        >
          {siteConfig.name}
        </Button>

        <div className="flex items-center gap-1">
          {[
            {
              href: "/about",
              label: "About",
              icon: <GlobalIcon width={19} color={undefined} />,
            },
            {
              href: "/blog",
              label: "Blog",
              icon: <BookOpen02Icon width={19} color={undefined} />,
            },
            {
              href: "https://gaia.featurebase.app",
              label: "Feature Request",
              icon: <Idea01Icon width={19} color={undefined} />,
              external: true,
            },
            {
              href: "https://gaia.featurebase.app/roadmap",
              label: "Roadmap",
              icon: <MapsIcon width={19} color={undefined} />,
              external: true,
            },
          ].map(({ href, label, icon, external }) => (
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
