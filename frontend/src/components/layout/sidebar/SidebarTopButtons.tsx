"use client";

import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { CircleArrowUp } from "lucide-react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import {
  CalendarIcon,
  ChatBubbleAddIcon,
  CheckmarkCircle02Icon,
  Mail01Icon,
  NotificationIcon,
  PinIcon,
  Route02Icon,
} from "@/components/shared/icons";
import { useConversation } from "@/features/chat/hooks/useConversation";
import { useUserSubscriptionStatus } from "@/features/pricing/hooks/usePricing";
import { Separator } from "@/components/ui";

export default function SidebarTopButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const { clearMessages } = useConversation();
  const { data: subscriptionStatus } = useUserSubscriptionStatus();

  const buttonData = [
    {
      route: "/calendar",
      icon: <CalendarIcon height={21} width={21} />,
      label: "Calendar",
    },
    {
      route: "/goals",
      icon: <Route02Icon height={21} width={21} />,
      label: "Goals",
    },
    {
      route: "/todos",
      icon: <CheckmarkCircle02Icon height={21} width={21} />,
      label: "Todos",
    },
    {
      route: "/mail",
      icon: <Mail01Icon height={21} width={21} />,
      label: "Mail",
    },
    {
      route: "/pins",
      icon: <PinIcon height={21} width={21} />,
      label: "Pins",
    },
    {
      route: "/notifications",
      icon: <NotificationIcon height={21} width={21} />,
      label: "Notifications",
    },
    // {
    //   route: "/browser",
    //   icon: <AiBrowserIcon height={23} width={23} />,
    //   label: "Use Browser",
    // },
  ];

  const createNewChat = (): void => {
    router.push(`/c`);
    clearMessages();
  };

  return (
    <div className="flex flex-col">
      {/* Only show Upgrade to Pro button when user doesn't have an active subscription */}
      {!subscriptionStatus?.is_subscribed && (
        <Link href={"/pricing"}>
          <Button
            variant="faded"
            className="mb-2 flex h-fit w-full justify-start gap-3 px-3"
          >
            <CircleArrowUp width={20} height={20} />
            <div className="flex items-center gap-4">
              <div className="flex w-full flex-col justify-center py-2">
                <div className="text-left text-sm font-medium">
                  Upgrade to Pro
                </div>
                <div className="line-clamp-2 text-left text-xs font-light text-wrap text-foreground-500">
                  All features & unlimited usage
                </div>
              </div>
            </div>
          </Button>
        </Link>
      )}

      {/* <Link href={"/dashboard"} className="w-full">
        <Button
          className="flex w-full justify-start text-sm"
          size="sm"
          variant="light"
          // color={pathname === route ? "primary" : "default"}
          // variant={pathname === route ? "solid" : "flat"}
          // onPress={() => router.push(route)}
          startContent={<DashboardSquare01Icon height={21} width={21} />}
        >
          Dashboard
        </Button>
      </Link> */}

      {/* <div className="grid grid-cols-6 grid-rows-1 items-start gap-1 rounded-2xl">
        {buttonData.map(({ route, icon, label }, index) => (
          <Tooltip
            key={index}
            content={label}
            showArrow={true}
            placement="bottom"
          >
            <Button
              className="aspect-square w-fit"
              isIconOnly
              color={pathname === route ? "primary" : "default"}
              variant={pathname === route ? "solid" : "flat"}
              onPress={() => router.push(route)}
            >
              {React.cloneElement(icon, {
                color: pathname === route ? "#000000AA" : "#FFFFFFAA",
              })}
            </Button>
          </Tooltip>
        ))}
      </div> */}

      <div className="flex flex-col gap-1">
        {buttonData.map(({ route, icon, label }, index) => (
          <Button
            key={index}
            className="w-full justify-start text-sm"
            size="sm"
            variant="light"
            color={pathname === route ? "primary" : "default"}
            onPress={() => router.push(route)}
            startContent={React.cloneElement(icon, {
              color: undefined,
            })}
          >
            {label}
          </Button>
        ))}
      </div>

      <Button
        className="mt-1 flex w-full justify-start text-sm"
        size="sm"
        variant="light"
        color={pathname.startsWith("/c") ? "primary" : "default"}
        onPress={createNewChat}
        startContent={
          <ChatBubbleAddIcon color={undefined} width={21} height={21} />
        }
      >
        New Chat
      </Button>

      <div className="my-2 px-3">
        <Separator className="bg-zinc-800" />
      </div>
    </div>
  );
}
