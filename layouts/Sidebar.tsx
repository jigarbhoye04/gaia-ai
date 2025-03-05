import { Tooltip } from "@heroui/tooltip";
import { LegacyRef, useState } from "react";

import ComingSoonModal from "@/components/ComingSoon/ComingSoonModal";
// import Hr from "@/components/HorizontalRuler";
import ChatsList from "@/components/Sidebar/ChatsList";
import CloseOpenSidebarBtn from "@/components/Sidebar/CloseOpenSidebar";
import SidebarTopButtons from "@/components/Sidebar/SidebarTopButtons";
import UserContainer from "@/components/Sidebar/UserContainer";
import { Button } from "@/components/ui/button";
import useMediaQuery from "@/hooks/mediaQuery";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import { useRouter } from "next/router";
import { PencilSquareIcon } from "@/components/Misc/icons";

export default function Sidebar({
  sidebarref,
  toggleSidebar,
  className = "",
  isSidebarVisible,
}: {
  sidebarref: LegacyRef<HTMLDivElement>;
  toggleSidebar: () => void;
  className?: string;
  isSidebarVisible: boolean;
}) {
  const [open, setOpen] = useState<boolean>(false);
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");
  const { resetMessages } = useConvo();
  const router = useRouter();

  return (
    <>
      <div
        ref={sidebarref}
        className={`sidebar flex ${className} ${
          isSidebarVisible
            ? "sm:min-w-[250px] sm:max-w-[250px] sm:translate-x-0 translate-x-[-350px]"
            : "sm:min-w-0 sm:max-w-0 sm:w-0 translate-x-0"
        } transition-all duration-100`}
      >
        <div className="overflow-y-auto min-w-[250px]">
          <div className="p-4 pb-0 ">
            <div className="flex items-center justify-between mb-1">
              <Tooltip
                content="general artificial intelligence assistant"
                offset={+0}
                placement="bottom"
              >
                {/* <div className="flex gap-2 items-center p-2"> */}
                {/* <GlobalIcon color="white" width="22" /> */}
                <span className="font-medium text-2xl">gaia</span>
                {/* </div> */}
              </Tooltip>

              <div className="flex items-center gap-1">
                <Button
                  aria-label="Create new chat"
                  className={`rounded-lg hover:bg-[#00bbff] group`}
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
            {/* 
            <div className="px-1">
              <Button
                variant="shadow"
                color="primary"
                className="w-full flex justify-between my-4 font-medium text-zinc-900"
                onPress={() => setOpen(true)}
              >
                Coming Soon!
                <StarsIcon color="zinc-900" fill="zinc-900" />
              </Button>
            </div> */}

            <SidebarTopButtons />
            {/* <Hr /> */}
          </div>

          <ChatsList />
        </div>
        <UserContainer />
      </div>

      <ComingSoonModal isOpen={open} setOpen={setOpen} />
    </>
  );
}
