"use client";

import { usePathname } from "next/navigation";
import { useState } from "react";

import ChatsList from "@/components/layout/sidebar/ChatsList";
import CalendarSidebar from "@/components/layout/sidebar/variants/CalendarSidebar";
import EmailSidebar from "@/components/layout/sidebar/variants/MailSidebar";
import SettingsSidebar from "@/components/layout/sidebar/variants/SettingsSidebar";
import TodoSidebar from "@/components/layout/sidebar/variants/TodoSidebar";
import ComingSoonModal from "@/features/coming-soon/components/ComingSoonModal";

export default function Sidebar() {
  const [open, setOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Determine which sidebar to show based on the current route
  if (pathname.startsWith("/todos")) return <TodoSidebar />;
  if (pathname.startsWith("/mail")) return <EmailSidebar />;
  if (pathname.startsWith("/calendar")) return <CalendarSidebar />;
  if (pathname.startsWith("/settings")) return <SettingsSidebar />;

  // Default to chat sidebar
  return (
    <div>
      <ChatsList />
      <ComingSoonModal isOpen={open} setOpen={setOpen} />
    </div>
  );
}
