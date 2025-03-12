import { LegacyRef, ReactNode } from "react";
import { PencilSquareIcon } from "@/components/Misc/icons";
import CloseOpenSidebarBtn from "@/components/Sidebar/CloseOpenSidebar";
import SidebarTopButtons from "@/components/Sidebar/SidebarTopButtons";
import UserContainer from "@/components/Sidebar/UserContainer";
import { Button } from "@/components/ui/button";
import useMediaQuery from "@/hooks/useMediaQuery";
import { useRouter } from "next/navigation";
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
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");
  const { clearMessages } = useConversation();
  const router = useRouter();

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
      <div className="flex flex-col h-full">
        <div className="p-2 pb-2 flex-none">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-2xl">gaia</span>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Create new chat"
                className="rounded-lg hover:bg-[#00bbff] group"
                size="icon"
                variant={"ghost"}
                onClick={() => {
                  router.push("/c");
                  clearMessages();
                }}
              >
                <PencilSquareIcon className="group-hover:text-white transition-all" />
              </Button>
              <CloseOpenSidebarBtn toggleSidebar={toggleSidebar} />
            </div>
          </div>
          <SidebarTopButtons />
        </div>

        <div className="flex-1 px-2 flex flex-col gap-1 relative overflow-y-auto pb-[50px]">
          {children}
        </div>
      </div>
      <div className="absolute w-full bottom-0 right-0">
        <UserContainer />
      </div>
    </div>
  );
}
