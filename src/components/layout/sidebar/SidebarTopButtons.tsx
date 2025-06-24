"use client";

import { Button } from "@heroui/button";
import { CircleArrowUp } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import {
  CalendarIcon,
  ChatBubbleAddIcon,
  CheckmarkSquare03Icon,
  DashboardSquare01Icon,
  Mail01Icon,
  PinIcon,
  Route02Icon,
} from "@/components/shared/icons";
import { useConversation } from "@/features/chat/hooks/useConversation";

export default function SidebarTopButtons() {
  const router = useRouter();
  const { clearMessages } = useConversation();

  const buttonData = [
    {
      route: "/calendar",
      icon: <CalendarIcon height={23} width={23} />,
      label: "Calendar",
    },
    {
      route: "/goals",
      icon: <Route02Icon height={23} width={23} />,
      label: "Goals",
    },
    {
      route: "/todos",
      icon: <CheckmarkSquare03Icon height={23} width={23} />,
      label: "Todos",
    },
    {
      route: "/mail",
      icon: <Mail01Icon height={23} width={23} />,
      label: "Mail",
    },
    {
      route: "/pins",
      icon: <PinIcon height={23} width={23} />,
      label: "Pins",
    },
  ];

  const createNewChat = (): void => {
    router.push(`/c`);
    clearMessages();
  };

  return (
    <div className="flex flex-col gap-1">
      <Link href={"/pricing"}>
        <Button
          variant="flat"
          className="mb-2 flex h-fit w-full justify-start gap-3 px-3"
        >
          <CircleArrowUp width={20} height={20} />
          <div className="flex items-center gap-4">
            <div className="flex w-full flex-col justify-center py-2">
              <div className="text-left text-sm font-medium">
                Upgrade to Pro
              </div>
              <div className="line-clamp-2 text-left text-xs text-wrap text-foreground-400">
                All features & unlimited usage
              </div>
            </div>
          </div>
        </Button>
      </Link>

      <Link href={"/dashboard"} className="w-full">
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
      </Link>

      <Button
        className="flex w-full justify-start text-sm text-primary"
        color="primary"
        size="sm"
        variant="light"
        onPress={createNewChat}
      >
        <ChatBubbleAddIcon color="#00bbff" width={18} />
        New Chat
      </Button>

      {/* <div className="grid grid-cols-3 grid-rows-2 items-start gap-1 rounded-2xl">
        {buttonData.map(({ route, icon, label }, index) => (
          <Tooltip
            key={index}
            content={label}
            showArrow={true}
            placement="bottom"
          >
            <Button
              className="aspect-square w-full"
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
    </div>
  );
}
