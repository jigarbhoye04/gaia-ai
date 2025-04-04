"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { HeaderComponentType } from "@/redux/slices/headerSlice";
import { useHeader } from "@/hooks/useHeader";

import BrowserHeader from "./BrowserHeader";
import ChatHeader from "./ChatHeader";
import DefaultHeader from "./DefaultHeader";
import GoalsHeader from "./GoalsHeader";
import MailHeader from "./MailHeader";
import NotesHeader from "./NotesHeader";

// Declare the global window interface to include our custom property
declare global {
  interface Window {
    __customHeaderJSX?: React.ReactNode;
  }
}

export default function HeaderManager() {
  const pathname = usePathname();
  const { setHeader, currentHeaderType, headerProps } = useHeader();

  useEffect(() => {
    let componentType: HeaderComponentType = "default";

    if (pathname.startsWith("/c/")) componentType = "chat";
    else if (pathname.startsWith("/mail")) componentType = "mail";
    else if (pathname.startsWith("/goals")) componentType = "goals";
    else if (pathname.startsWith("/calendar")) componentType = "calendar";
    else if (pathname.startsWith("/browser")) componentType = "browser";
    // Don't override custom headers set by other components
    else if (currentHeaderType === "notes" && pathname.startsWith("/notes"))
      return;

    setHeader(componentType);
  }, [pathname, setHeader, currentHeaderType]);

  // If it's a custom header, render the stored JSX
  if (currentHeaderType === "custom" && window.__customHeaderJSX) {
    return <>{window.__customHeaderJSX}</>;
  }

  // Render the appropriate component based on currentHeaderType
  switch (currentHeaderType) {
    case "chat":
      return <ChatHeader {...headerProps} />;
    case "mail":
      return <MailHeader {...headerProps} />;
    case "goals":
      return <GoalsHeader {...headerProps} />;
    case "calendar":
      return <DefaultHeader {...headerProps} />;
    case "browser":
      return <BrowserHeader {...headerProps} />;
    case "default":
    default:
      return <DefaultHeader {...headerProps} />;
  }
}
