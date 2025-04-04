"use client";

import { InboxIcon } from "@/components/Misc/icons";
import HeaderComponent from "./HeaderComponent";

export default function MailHeader() {
  return <HeaderComponent title="Inbox" icon={<InboxIcon />} />;
}
