"use client";

import { Button } from "@heroui/button";
import { useRouter, useSearchParams } from "next/navigation";

import {
  AiBrain01Icon,
  MessageMultiple02Icon,
  Settings01Icon,
  UserIcon,
} from "@/components/shared/icons";

type MenuItem = {
  label: string;
  icon: React.ElementType;
  href: string;
};

export default function SettingsSidebar() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const currentSection = searchParams.get("section") || "general";

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const settingsMenuItems: MenuItem[] = [
    {
      label: "General",
      icon: Settings01Icon,
      href: "/settings?section=general",
    },
    {
      label: "Account",
      icon: UserIcon,
      href: "/settings?section=account",
    },
    {
      label: "Chat",
      icon: MessageMultiple02Icon,
      href: "/settings?section=preferences",
    },
    {
      label: "Memory",
      icon: AiBrain01Icon,
      href: "/settings?section=memory",
    },
  ];

  return (
    <div className="flex h-full max-w-[280px] flex-col">
      <nav className="flex-1 space-y-1">
        {settingsMenuItems.map((item) => {
          const isActive = currentSection === item.href.split("section=")[1];
          const Icon = item.icon;

          return (
            <Button
              key={item.href}
              onPress={() => handleNavigation(item.href)}
              size="sm"
              variant={isActive ? "flat" : "light"}
              color={isActive ? "primary" : "default"}
              className={`group ${isActive ? "text-primary" : ""} flex w-full justify-start`}
            >
              <Icon
                className={`mr-1 h-5 w-5 transition-colors ${isActive ? "" : "text-foreground-500"}`}
              />
              <span className="text-sm">{item.label}</span>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
