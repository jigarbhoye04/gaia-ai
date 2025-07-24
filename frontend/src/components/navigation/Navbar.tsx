"use client";

import { Button } from "@heroui/button";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";

import MobileMenu from "@/components/navigation/MobileMenu";
import { LinkButton } from "@/components/shared/LinkButton";
import { appConfig } from "@/config/appConfig";
import useMediaQuery from "@/hooks/ui/useMediaQuery";

import { NavbarMenu } from "./NavbarMenu";
import { RainbowGithubButton } from "./RainbowGithubButton";

export default function Navbar() {
  const pathname = usePathname();
  const isMobileScreen = useMediaQuery("(max-width: 990px)");
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);

  // Function to control backdrop blur
  const toggleBackdrop = (show: boolean) => {
    const backdrop = document.getElementById('navbar-backdrop');
    if (backdrop) {
      if (show) {
        backdrop.style.opacity = '1';
        backdrop.style.pointerEvents = 'none';
      } else {
        backdrop.style.opacity = '0';
        backdrop.style.pointerEvents = 'none';
      }
    }
  };

  // Handle mouse leave for navbar container
  const handleNavbarMouseLeave = () => {
    if (!isMobileScreen) {
      setActiveDropdown(null);
      setHoveredItem(null);
      toggleBackdrop(false);
    }
  };

  const handleMouseEnter = (menu: string) => {
    if (!isMobileScreen) {
      setActiveDropdown(menu);
      setHoveredItem(menu);
      toggleBackdrop(true);
    }
  };

  const handleMouseLeave = () => {
    if (!isMobileScreen) {
      setActiveDropdown(null);
      setHoveredItem(null);
      toggleBackdrop(false);
    }
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      toggleBackdrop(false);
    };
  }, []);

  return (
    <div className="fixed top-0 left-0 w-full z-50 pt-4 px-4">
      <div 
        className="relative max-w-7xl mx-auto"
        onMouseLeave={handleNavbarMouseLeave}
      >
        <div 
          className={`navbar_content backdrop-blur-xl flex h-16 w-full justify-between items-center px-6 transition-all duration-300 bg-[#ffffff08] ${
            activeDropdown ? 'rounded-t-2xl bg-[#08090A]' : 'rounded-2xl'
          }`}
          style={activeDropdown ? { backgroundColor: '#08090A' } : {}}
        >
          <Button
            as={Link}
            radius="full"
            href={"/"}
            variant="light"
            isIconOnly
            className="h-10 w-10"
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
            <div className="flex items-center gap-1 px-1 py-1 rounded-full border border-[#ffffff26] bg-[rgba(17, 25, 40, 0.65)] backdrop-blur-xl">
              {['product', 'resources', 'company', 'socials'].map((menu) => (
                <button
                  key={menu}
                  className="relative text-sm font-medium text-zinc-400 hover:text-zinc-100 px-4 py-2 rounded-full transition-colors capitalize"
                  onMouseEnter={() => handleMouseEnter(menu)}
                >
                  {hoveredItem === menu && (
                    <motion.div
                      layoutId="navbar-pill"
                      className="absolute inset-0 h-full w-full rounded-full bg-zinc-800"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30
                      }}
                    />
                  )}
                  <span className="relative z-10">
                    {menu === 'socials' ? 'Socials' : menu.charAt(0).toUpperCase() + menu.slice(1)}
                  </span>
                </button>
              ))}
            </div>
          )}

          {isMobileScreen ? (
            <div className="hidden"></div>
          ) : (
            <div className="hidden items-center gap-3 sm:flex">

              {/* Github Stars Button will come Here */}
              <RainbowGithubButton />

              <LinkButton
                size="sm"
                className="text-sm font-medium text-zinc-400 hover:text-zinc-100 px-4 py-2"
                as={Link}
                href="/login"
              >
                Login
              </LinkButton>
              <LinkButton
                size="sm"
                className="text-sm font-medium bg-white text-black hover:bg-zinc-200 px-4 py-2 rounded-full"
                as={Link}
                href="/signup"
              >
                Sign up
              </LinkButton>
            </div>
          )}


        </div>

        {activeDropdown && (
          <NavbarMenu
            activeMenu={activeDropdown}
            onClose={() => setActiveDropdown(null)}
          />
        )}
      </div>
    </div>
  );
}