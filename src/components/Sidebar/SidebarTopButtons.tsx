"use client";

import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { usePathname, useRouter } from "next/navigation";
import React from "react";

import {
  CalendarIcon,
  Mail01Icon,
  PinIcon,
  Route02Icon,
  StickyNote01Icon,
} from "../Misc/icons";

export default function SidebarTopButtons() {
  const router = useRouter();
  const pathname = usePathname();

  const buttonData = [
    {
      route: "/calendar",
      icon: <CalendarIcon height={27} width={27} />,
      label: "Calendar",
    },
    {
      route: "/goals",
      icon: <Route02Icon height={27} width={27} />,
      label: "Goals",
    },
    {
      route: "/mail",
      icon: <Mail01Icon height={27} width={27} />,
      label: "Mail",
    },
    {
      route: "/notes",
      icon: <StickyNote01Icon height={27} width={27} />,
      label: "Notes",
    },
    {
      route: "/pins",
      icon: <PinIcon height={27} width={27} />,
      label: "Pins",
    },
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
    </div>
  );
}
