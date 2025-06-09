"use client";

import { Button } from "@heroui/button";
import {
  Brain,
  ChevronLeft,
  MessageSquare,
  Settings,
  User,
} from "lucide-react";
import { useRouter, useSearchParams } from "next/navigation";

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
      icon: Settings,
      href: "/settings?section=general",
    },
    {
      label: "Account",
      icon: User,
      href: "/settings?section=account",
    },
    {
      label: "Chat",
      icon: MessageSquare,
      href: "/settings?section=preferences",
    },
    {
      label: "Memory",
      icon: Brain,
      href: "/settings?section=memory",
    },
  ];

  return (
    <div className="flex h-full max-w-[280px] flex-col">
      <div className="">
        <Button
          size="sm"
          className="w-full"
          variant="light"
          color="primary"
          onPress={() => router.push("/c")}
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          <span className="text-sm">Back to Chat</span>
        </Button>
      </div>

      <nav className="mt-5 flex-1 space-y-2">
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
              <Icon className={`mr-3 h-5 w-5 transition-colors`} />
              <span className="text-sm">{item.label}</span>
            </Button>
          );
        })}
      </nav>
    </div>
  );
}
