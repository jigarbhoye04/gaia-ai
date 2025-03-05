import { useState } from "react";
import ComingSoonModal from "@/components/ComingSoon/ComingSoonModal";
import ChatsList from "@/components/Sidebar/ChatsList";

export default function Sidebar() {
  const [open, setOpen] = useState<boolean>(false);

  return (
    <>
      <ChatsList />
      <ComingSoonModal isOpen={open} setOpen={setOpen} />
    </>
  );
}
