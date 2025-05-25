import { usePathname } from "next/navigation";
import { useState } from "react";

import ComingSoonModal from "@/components/ComingSoon/ComingSoonModal";
import ChatsList from "@/components/Sidebar/ChatsList";
import EmailSidebar from "@/components/Sidebar/variants/MailSidebar";
import TodoSidebar from "@/components/Sidebar/variants/TodoSidebar";

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
