"use client";

import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { SearchIcon } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import React, { useState } from "react";

import {
  AiBrowserIcon,
  CalendarIcon,
  Mail01Icon,
  PinIcon,
  Route02Icon,
  StickyNote01Icon,
} from "../Misc/icons";
import SearchCommand from "../Search/SearchCommand";

export default function SidebarTopButtons() {
  const router = useRouter();
  const pathname = usePathname();
  const [openSearchDialog, setOpenSearchDialog] = useState(false);

  const buttonData = [
    {
      icon: <SearchIcon height={26} width={26} />,
      label: "Search",
    },
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
    {
      route: "/browser",
      icon: <AiBrowserIcon height={27} width={27} />,
      label: "Use Browser",
    },
  ];

  return (
    <>
      <SearchCommand
        openSearchDialog={openSearchDialog}
        setOpenSearchDialog={setOpenSearchDialog}
      />

      <div className="grid grid-cols-3 grid-rows-2 items-start gap-1 rounded-2xl bg-[#141414] p-2">
        {buttonData.map(({ route, icon, label }, index) => (
          <Tooltip
            key={index}
            content={label}
            showArrow={true}
            placement="bottom"
          >
            <Button
              className="w-full"
              isIconOnly
              color={pathname === route ? "primary" : "default"}
              variant={pathname === route ? "solid" : "flat"}
              onPress={() =>
                label === "Search"
                  ? setOpenSearchDialog(true)
                  : route
                    ? router.push(route)
                    : undefined
              }
            >
              {React.cloneElement(icon, {
                color: pathname === route ? "#000000AA" : "#FFFFFFAA",
              })}
            </Button>
          </Tooltip>
        ))}
      </div>
    </>
  );
}
