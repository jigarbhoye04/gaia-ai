"use client";

import { useDrag } from "@use-gesture/react";
import { usePathname } from "next/navigation";
import { ReactNode, useEffect, useRef, useState } from "react";

import HeaderManager from "@/components/Misc/Headers/HeaderManager";
import CloseOpenSidebarBtn from "@/components/Sidebar/CloseOpenSidebar";
import EmailSidebar from "@/components/Sidebar/MailSidebar";
import Sidebar from "@/components/Sidebar/MainSidebar";
import { TooltipProvider } from "@/components/ui/tooltip";
import useMediaQuery from "@/hooks/useMediaQuery";
import SidebarLayout from "@/layouts/SidebarLayout";

export default function MainLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const sidebarRef = useRef<HTMLDivElement | null>(null);
  const contentContainerRef = useRef<HTMLDivElement | null>(null);
  const [isSidebarVisible, setSidebarVisible] = useState(true);
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");

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
      if (tap || !isMobileScreen) return;

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
          className="main_chat bg-zinc-900/60 p-2 transition-all sm:p-[1rem]"
        >
          <div
            className={`top-0 z-10 flex w-full justify-between rounded-xl transition-opacity sm:left-4 sm:px-0`}
          >
            <CloseOpenSidebarBtn
              isSidebarVisible={isSidebarVisible}
              toggleSidebar={toggleSidebar}
            />
            <HeaderManager />
          </div>
          {children}
        </div>
      </div>
    </TooltipProvider>
  );
}
