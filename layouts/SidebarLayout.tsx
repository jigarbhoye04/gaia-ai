import { LegacyRef, ReactNode } from "react";
import { PencilSquareIcon } from "@/components/Misc/icons";
import CloseOpenSidebarBtn from "@/components/Sidebar/CloseOpenSidebar";
import SidebarTopButtons from "@/components/Sidebar/SidebarTopButtons";
import UserContainer from "@/components/Sidebar/UserContainer";
import { Button } from "@/components/ui/button";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import useMediaQuery from "@/hooks/mediaQuery";
import { useRouter } from "next/navigation";

export default function SidebarLayout({
  children,
  sidebarref,
  toggleSidebar,
  className = "",
  isSidebarVisible,
}: {
  children: ReactNode;
  sidebarref: LegacyRef<HTMLDivElement>;
  toggleSidebar: () => void;
  className?: string;
  isSidebarVisible: boolean;
}) {
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");
  const { resetMessages } = useConvo();
  const router = useRouter();

  return (
    <div
      ref={sidebarref}
      className={`sidebar flex ${className} ${
        isSidebarVisible
          ? "sm:min-w-[250px] sm:max-w-[250px] sm:translate-x-0 translate-x-[-350px]"
          : "sm:min-w-0 sm:max-w-0 sm:w-0 translate-x-0"
      } transition-all duration-100`}
    >
      <div className="min-w-[250px] flex flex-col h-full">
        <div className="p-2 pb-2 flex-none">
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-2xl">gaia</span>
            <div className="flex items-center gap-1">
              <Button
                aria-label="Create new chat"
                className="rounded-lg hover:bg-[#00bbff] group"
                size="icon"
                variant={isMobileScreen ? "default" : "ghost"}
                onClick={() => {
                  router.push("/c");
                  resetMessages();
                }}
              >
                <PencilSquareIcon className="group-hover:text-white transition-all" />
              </Button>
              <CloseOpenSidebarBtn toggleSidebar={toggleSidebar} />
            </div>
          </div>
          <SidebarTopButtons />
        </div>

        <div
          className="flex-1 px-2 flex flex-col gap-1 relative overflow-y-auto pb-[50px]"
          // style={{ scrollbarGutter: "stable both-edges" }}
        >
          {children}
        </div>
      </div>
      <div className="absolute w-full bottom-0 right-0">
        <UserContainer />
      </div>
    </div>
  );
}
