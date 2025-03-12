"use client";

import {
  BubbleConversationChatIcon,
  ChatBubbleAddIcon,
} from "@/components/Misc/icons";
import ChatOptionsDropdown from "@/components/Sidebar/ChatOptionsDropdown";
import CloseOpenSidebarBtn from "@/components/Sidebar/CloseOpenSidebar";
import EmailSidebar from "@/components/Sidebar/MailSidebar";
import Sidebar from "@/components/Sidebar/MainSidebar";
import { Button } from "@/components/ui/button";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useConversation } from "@/hooks/useConversation";
import { useConversationList } from "@/hooks/useConversationList";
import useFetchUser from "@/hooks/useFetchUser";
import useMediaQuery from "@/hooks/useMediaQuery";
import SidebarLayout from "@/layouts/SidebarLayout";
import { useDrag } from "@use-gesture/react";
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
  const { clearMessages } = useConversation();
  const { fetchUserInfo } = useFetchUser();

  useEffect(() => {
    fetchUserInfo();
  }, [searchParams]);

  useEffect(() => {
    fetchUserInfo();
  }, []);

  useEffect(() => {
    if (isMobileScreen) setSidebarVisible(false);
  }, [pathname, isMobileScreen]);

  function toggleSidebar(): void {
    if (sidebarRef.current && contentContainerRef.current)
      setSidebarVisible((prev) => !prev);
  }

  function closeOnTouch(): void {
    if (sidebarRef.current && isMobileScreen && isSidebarVisible)
      setSidebarVisible(false);
  }

  const bind = useDrag(
    ({ movement: [mx, my], last, tap }) => {
      // If this is just a tap, do nothing—allow click events to proceed.
      if (tap) return;

      if (last && Math.abs(mx) > Math.abs(my)) {
        if (mx > 0) setSidebarVisible(true); // Swipe right to open
        else if (mx < 0) setSidebarVisible(false); // Swipe left to close
      }
    },
    {
      filterTaps: true, // Taps are ignored for swipe detection.
      threshold: 10, // Minimal movement before detecting a swipe.
      axis: "x", // Only track horizontal swipes.
    }
  );

  return (
    <TooltipProvider>
      <div
        className="main_container dark"
        style={{ touchAction: "pan-y" }}
        {...bind()}
      >
        {/* <div
          {...bind()}
          className="absolute top-0 left-0 h-full w-[100vw] bg-transparent z-50"
          style={{
            touchAction: "pan-y", // Allow vertical scroll
            pointerEvents: "none", // Let clicks pass through
          }}
        /> */}

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
          onClick={closeOnTouch}
          className="main_chat sm:p-[1rem] p-2 transition-all bg-custom-gradient"
        >
          <div
            className={`sm:left-4 sm:px-0 top-0 rounded-xl transition-opacity flex w-full justify-between z-10`}
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
            {/* <div className="flex gap-2"> */}
            <Button
              aria-label="Create new chat"
              className={`rounded-lg hover:bg-[#00bbff] group text-foreground-600`}
              size="icon"
              variant={"ghost"}
              onClick={() => {
                router.push("/c");
                clearMessages();
              }}
            >
              <ChatBubbleAddIcon
                className="group-hover:text-white transition-all"
                color={undefined}
              />
            </Button>
            {/* <Button
                aria-label="Create new chat"
                className={`rounded-lg hover:bg-[#00bbff]/20 group`}
                size="icon"
                // variant={isMobileScreen ? "default" : "ghost"}
                variant={"ghost"}
                onClick={() => {
                  router.push("/notifications");
                  clearMessages();
                }}
              >
                <NotificationIcon className="group-hover:text-white transition-all" />
              </Button> */}
            {/* </div> */}
          </div>
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}
