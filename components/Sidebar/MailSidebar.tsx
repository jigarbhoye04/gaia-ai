"use client";

import { Button } from "@heroui/button";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";
import MailCompose from "../Mail/MailCompose";
import {
  InboxIcon,
  LabelImportantIcon,
  QuillWrite01Icon,
  Sent02Icon,
  TimeScheduleIcon
} from "../Misc/icons";

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
  path: string;
  pathname: string;
  router: ReturnType<typeof useRouter>;
};

function MailButton({ label, Icon, path, pathname, router }: MailButtonProps) {

  return (
    <Button
      onPress={() => router.push(path)}
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

  const pathname = usePathname();
  const router = useRouter();


  return (
    <div className="flex h-full flex-col">
      <div className="text-sm text-foreground-500 px-2 font-medium pb-1">
        Mail
      </div>
      {items.map((item, index) => (
        <MailButton key={index} label={item.label} Icon={item.icon} path={item.path} pathname={pathname} router={router} />
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
