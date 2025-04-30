"use client";

import { Button } from "@heroui/button";
import { useState } from "react";

import MailCompose from "../../Mail/MailCompose";
import {
  InboxIcon,
  QuillWrite01Icon,
} from "../../Misc/icons";

type MailItem = {
  label: string;
  icon: React.ElementType;
};

const mailItems: MailItem[] = [
  { label: "Inbox", icon: InboxIcon },
  // { label: "Important", icon: LabelImportantIcon },
  // { label: "Sent", icon: Sent02Icon },
  // { label: "Drafts", icon: LicenseDraftIcon },
  // { label: "Scheduled", icon: TimeScheduleIcon },
  //   { label: "Trash", icon: LicenseDraftIcon },
];

type MailButtonProps = {
  label: string;
  Icon: React.ElementType;
};

function MailButton({ label, Icon }: MailButtonProps) {
  return (
    <Button
      startContent={<Icon color={undefined} className="mr-1" />}
      className="justify-start pl-2 text-start text-foreground-600"
      variant="light"
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
      <div className="px-2 pb-1 text-sm font-medium text-foreground-500">
        Mail
      </div>
      {items.map((item, index) => (
        <MailButton key={index} label={item.label} Icon={item.icon} />
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
            className="w-full justify-start text-sm text-primary"
            color="primary"
            size="sm"
            variant="flat"
            onPress={() => setOpen(true)}
          >
            <QuillWrite01Icon color={undefined} width={18} />
            Compose Email
          </Button>
        </div>
        <MailContainer items={mailItems} />
      </div>
      <MailCompose open={open} onOpenChange={setOpen} />
    </>
  );
}
