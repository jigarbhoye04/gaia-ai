"use client";

import {
  BubbleConversationChatIcon,
  NotificationIcon,
  PencilSquareIcon,
} from "@/components/Misc/icons";
import ChatOptionsDropdown from "@/components/Sidebar/ChatOptionsDropdown";
import CloseOpenSidebarBtn from "@/components/Sidebar/CloseOpenSidebar";
import EmailSidebar from "@/components/Sidebar/MailSidebar";
import Sidebar from "@/components/Sidebar/MainSidebar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useConversationList } from "@/contexts/ConversationList";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import useFetchUser from "@/hooks/useFetchUser";
import useMediaQuery from "@/hooks/useMediaQuery";
import SidebarLayout from "@/layouts/SidebarLayout";
import {
  useParams,
  usePathname,
  useRouter,
  useSearchParams,
} from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const { conversations } = useConversationList();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");
  const searchParams = useSearchParams();
  const { resetMessages } = useConvo();
  const { fetchUserInfo } = useFetchUser();

  useEffect(() => {
    fetchUserInfo();
  }, [searchParams]);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  function toggleSidebar(): void {
    if (sidebarRef.current && contentContainerRef.current)
      setSidebarVisible((prev) => !prev);
  }

  return (
    <TooltipProvider>
      <div className="main_container dark">
        <SidebarLayout
          isSidebarVisible={isSidebarVisible}
          sidebarref={sidebarRef}
          toggleSidebar={toggleSidebar}
          children={
            pathname.startsWith("/mail") ? <EmailSidebar /> : <Sidebar />
          }
        />

        <div
          ref={contentContainerRef}
          className="main_chat sm:p-[1rem] p-2 transition-all bg-custom-gradient"
        >
          <div
            className={`sm:left-4 sm:px-0 pb-3 top-0 rounded-xl transition-opacity flex w-full justify-between z-10`}
          >
            <CloseOpenSidebarBtn
              isSidebarVisible={isSidebarVisible}
              toggleSidebar={toggleSidebar}
            />

            <div>
              {convoIdParam && pathname.startsWith("/c/") && (
                <ChatOptionsDropdown
                  btnChildren={
                    <div className="!text-sm max-w-[250px] truncate flex items-center gap-2">
                      <BubbleConversationChatIcon height={18} width={18} />

                      {conversations.find(
                        (convo) => convo.conversation_id == convoIdParam
                      )?.description || "New Chat"}
                    </div>
                  }
                  buttonHovered={true}
                  chatId={convoIdParam}
                  chatName={
                    conversations.find(
                      (convo) => convo.conversation_id == convoIdParam
                    )?.description || "New Chat"
                  }
                  logo2={true}
                  starred={
                    conversations.find(
                      (convo) => convo.conversation_id == convoIdParam
                    )?.starred || false
                  }
                />
              )}
            </div>
            <div className="flex gap-5">
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
              <Button
                aria-label="Create new chat"
                className={`rounded-lg hover:bg-[#00bbff]/20 group`}
                size="icon"
                variant={isMobileScreen ? "default" : "ghost"}
                onClick={() => {
                  router.push("/notifications");
                  resetMessages();
                }}
              >
                <NotificationIcon className="group-hover:text-white transition-all" />
              </Button>
            </div>
          </div>
          {/* <Suspense fallback={<SuspenseLoader />}> */}
          {children}
          {/* </Suspense> */}
        </div>
      </div>
    </TooltipProvider>
  );
}
