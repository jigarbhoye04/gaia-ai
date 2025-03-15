"use client";

import { Button } from "@heroui/button";
import {
  InboxIcon,
  LabelImportantIcon,
  LicenseDraftIcon,
  QuillWrite01Icon,
  Sent02Icon,
  TimeScheduleIcon,
} from "../Misc/icons";
import MailCompose from "../Mail/MailCompose";
import { useState } from "react";
import { usePathname } from "next/navigation";

type MailItem = {
  label: string;
  icon: React.ElementType;
  path: string;
};

const mailItems: MailItem[] = [
  { label: "Inbox", icon: InboxIcon, path: "/mail" },
  { label: "Important", icon: LabelImportantIcon, path: "/mail/important" },
  { label: "Sent", icon: Sent02Icon, path: "/mail/sent" },
  { label: "Scheduled", icon: TimeScheduleIcon, path: "/mail/scheduled" },
];

type MailButtonProps = {
  label: string;
  Icon: React.ElementType;
  path: string
};

function MailButton({ label, Icon, path }: MailButtonProps) {

  const pathname = usePathname();

  return (
    <Button
      startContent={<Icon color={undefined} className="mr-1" />}
      className={`text-start justify-start pl-2 ${path === pathname ? "text-primary" : "text-foreground-600"}`}
      variant="light"
      color={path === pathname ? "primary" : "default"}
      radius="sm"
    >
      {label}
    </Button>
  );
}

type MailContainerProps = {
  items: MailItem[];
};

function MailContainer({ items }: MailContainerProps) {
  return (
    <div className="flex h-full flex-col">
      <div className="text-sm text-foreground-500 px-2 font-medium pb-1">
        Mail
      </div>
      {items.map((item, index) => (
        <MailButton key={index} label={item.label} Icon={item.icon} path={item.path} />
      ))}
    </div>
  );
}

export default function EmailSidebar() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <div className="flex h-full flex-col">
        <div className="mb-5 w-full">
          <Button
            className="w-full justify-start text-medium font-medium"
            color="primary"
            onPress={() => setOpen(true)}
          >
            <QuillWrite01Icon color={undefined} width={22} />
            Compose
          </Button>
        </div>
        <MailContainer items={mailItems} />
      </div>
      <MailCompose open={open} onOpenChange={setOpen} />
    </>
  );
}
