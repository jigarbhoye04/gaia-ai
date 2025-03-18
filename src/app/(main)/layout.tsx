"use client";

import { useDrag } from "@use-gesture/react";
import { useParams, usePathname, useRouter } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

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
import useMediaQuery from "@/hooks/useMediaQuery";
import SidebarLayout from "@/layouts/SidebarLayout";

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const { conversations } = useConversationList();
  const { id: convoIdParam } = useParams<{ id: string }>();
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");
  const { clearMessages } = useConversation();

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
        if (mx > 0)
          setSidebarVisible(true); // Swipe right to open
        else if (mx < 0) setSidebarVisible(false); // Swipe left to close
      }
    },
    {
      filterTaps: true, // Taps are ignored for swipe detection.
      threshold: 10, // Minimal movement before detecting a swipe.
      axis: "x", // Only track horizontal swipes.
    },
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
        >
          {pathname.startsWith("/mail") ? <EmailSidebar /> : <Sidebar />}
          </SidebarLayout>

        <div
          ref={contentContainerRef}
          onClick={closeOnTouch}
          className="main_chat bg-custom-gradient p-2 transition-all sm:p-[1rem]"
        >
          <div
            className={`top-0 z-10 flex w-full justify-between rounded-xl transition-opacity sm:left-4 sm:px-0`}
          >
            <CloseOpenSidebarBtn
              isSidebarVisible={isSidebarVisible}
              toggleSidebar={toggleSidebar}
            />

            <div>
              {convoIdParam && pathname.startsWith("/c/") && (
                <ChatOptionsDropdown
                  btnChildren={
                    <div className="flex max-w-[250px] items-center gap-2 truncate !text-sm">
                      <BubbleConversationChatIcon height={18} width={18} />

                      {conversations.find(
                        (convo) => convo.conversation_id == convoIdParam,
                      )?.description || "New Chat"}
                    </div>
                  }
                  buttonHovered={true}
                  chatId={convoIdParam}
                  chatName={
                    conversations.find(
                      (convo) => convo.conversation_id == convoIdParam,
                    )?.description || "New Chat"
                  }
                  logo2={true}
                  starred={
                    conversations.find(
                      (convo) => convo.conversation_id == convoIdParam,
                    )?.starred || false
                  }
                />
              )}
            </div>
            {/* <div className="flex gap-2"> */}
            <Button
              aria-label="Create new chat"
              className={`group rounded-lg text-foreground-600 hover:bg-[#00bbff]`}
              size="icon"
              variant={"ghost"}
              onClick={() => {
                router.push("/c");
                clearMessages();
              }}
            >
              <ChatBubbleAddIcon
                className="transition-all group-hover:text-white"
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
