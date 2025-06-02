import { usePathname } from "next/navigation";
import { useState } from "react";

import ChatsList from "@/components/layout/sidebar/ChatsList";
import EmailSidebar from "@/components/layout/sidebar/variants/MailSidebar";
import TodoSidebar from "@/components/layout/sidebar/variants/TodoSidebar";
import ComingSoonModal from "@/features/coming-soon/components/ComingSoonModal";

export default function Sidebar() {
  const [open, setOpen] = useState<boolean>(false);
  const pathname = usePathname();

  // Determine which sidebar to show based on the current route
  if (pathname.startsWith("/todos")) {
    return <TodoSidebar />;
  }

  if (pathname.startsWith("/mail")) {
    return <EmailSidebar />;
  }

  // Default to chat sidebar
  return (
    <>
      <ChatsList />
      <ComingSoonModal isOpen={open} setOpen={setOpen} />
    </>
  );
}
