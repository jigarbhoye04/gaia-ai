"use client";

import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import {
  CalendarIcon,
  CheckmarkSquare03Icon,
  Mail01Icon,
  PinIcon,
  Route02Icon,
} from "@/components/shared/icons";
// import { Button } from "@/components/ui/shadcn/button";

export default function SidebarTopButtons() {
  const router = useRouter();
  const pathname = usePathname();

  const buttonData = [
    {
      route: "/calendar",
      icon: <CalendarIcon height={23} width={23} />,
      label: "Calendar",
    },
    {
      route: "/goals",
      icon: <Route02Icon height={23} width={23} />,
      label: "goals",
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
    // {
    //   route: "/notes",
    //   icon: <StickyNote01Icon height={23} width={23} />,
    //   label: "notes",
    // },
    {
      route: "/pins",
      icon: <PinIcon height={23} width={23} />,
      label: "pins",
    },
    // {
    //   route: "/browser",
    //   icon: <AiBrowserIcon height={23} width={23} />,
    //   label: "Use Browser",
    // },
  ];

  return (
    <div className="grid grid-cols-3 grid-rows-2 items-start gap-1 rounded-2xl">
      {buttonData.map(({ route, icon, label }, index) => (
        <Tooltip
          key={index}
          content={label}
          showArrow={true}
          placement="bottom"
        >
          <Button
            className="aspect-square w-full"
            // isIconOnly
            color={pathname === route ? "primary" : "default"}
            // variant={pathname === route ? "solid" : "flat"}
            // onPress={() => router.push(route)}
            onClick={() => router.push(route)}
          >
            {React.cloneElement(icon, {
              color: pathname === route ? "#000000AA" : "#FFFFFFAA",
            })}
          </Button>
        </Tooltip>
      ))}
    </div>
  );
}
