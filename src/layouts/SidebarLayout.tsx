import { Search } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { LegacyRef, ReactNode, useState } from "react";

import { ChatBubbleAddIcon } from "@/components/Misc/icons";
import SearchCommand from "@/components/Search/SearchCommand";
import CloseOpenSidebarBtn from "@/components/Sidebar/CloseOpenSidebar";
import SidebarTopButtons from "@/components/Sidebar/SidebarTopButtons";
import UserContainer from "@/components/Sidebar/UserContainer";
import { Button } from "@/components/ui/button";
import { useConversation } from "@/hooks/useConversation";

export default function SidebarLayout({
  sidebarref,
  toggleSidebar,
  className = "",
  isSidebarVisible,
  children,
}: {
  sidebarref: LegacyRef<HTMLDivElement>;
  toggleSidebar: () => void;
  className?: string;
  isSidebarVisible: boolean;
  children: ReactNode;
}) {
  const { clearMessages } = useConversation();
  const router = useRouter();
  const [openSearchDialog, setOpenSearchDialog] = useState(false);

  return (
    <div
      ref={sidebarref}
      className={`sidebar flex ${className}`}
      style={{
        transform: isSidebarVisible ? "translateX(0)" : "translateX(-350px)",
        minWidth: isSidebarVisible ? "250px" : "0",
        maxWidth: isSidebarVisible ? "fit-content" : "0",
        transition:
          "transform 200ms ease-in-out, min-width 200ms ease-in-out, max-width 200ms ease-in-out",
      }}
    >
      <SearchCommand
        openSearchDialog={openSearchDialog}
        setOpenSearchDialog={setOpenSearchDialog}
      />

      <div className="flex h-full flex-col">
        <div className="mr-2 flex-none px-2 pt-3 pb-2 sm:pt-1">
          <div className="mb-1 flex items-center justify-between">
            <div className="flex items-center gap-2 pl-1">
              <Image
                alt="GAIA Logo"
                src={"/branding/logo.webp"}
                width={23}
                height={23}
              />
              {/* <span className="text-lg font-medium">gaia</span> */}
            </div>
            <div className="flex items-center">
              <Button
                aria-label="Create new chat"
                className={`group rounded-lg hover:bg-[#00bbff]/20`}
                size="icon"
                variant={"ghost"}
                onClick={() => {
                  setOpenSearchDialog(true);
                }}
              >
                <Search className="text-zinc-400 transition-all group-hover:text-primary" />
              </Button>

              <Button
                aria-label="Create new chat"
                className={`group rounded-lg hover:bg-[#00bbff]/20`}
                size="icon"
                variant={"ghost"}
                onClick={() => {
                  router.push("/c");
                  clearMessages();
                }}
              >
                <ChatBubbleAddIcon className="text-zinc-400 transition-all group-hover:text-primary" />
              </Button>

              <CloseOpenSidebarBtn toggleSidebar={toggleSidebar} />
            </div>
          </div>
          <SidebarTopButtons />
        </div>

        <div className="relative flex flex-1 flex-col gap-1 overflow-y-auto px-2 pb-[50px]">
          {children}
        </div>
      </div>
      <div className="absolute right-0 bottom-0 w-full">
        <UserContainer />
      </div>
    </div>
  );
}
