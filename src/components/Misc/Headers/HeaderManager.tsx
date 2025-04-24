"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";

import { useHeader } from "@/hooks/useHeader";
import { HeaderComponentType } from "@/redux/slices/headerSlice";

import BrowserHeader from "./BrowserHeader";
import ChatHeader from "./ChatHeader";
import DefaultHeader from "./DefaultHeader";
import MailHeader from "./MailHeader";

// Declare the global window interface to include our custom property
declare global {
  interface Window {
    __customHeaderJSX?: React.ReactNode;
  }
}

export default function HeaderManager() {
  const pathname = usePathname();
  const { setHeader, currentHeaderType, headerProps } = useHeader();
  const previousPathRef = useRef<string | null>(null);

  useEffect(() => {
    let componentType: HeaderComponentType = "default";
    const previousPath = previousPathRef.current;
    previousPathRef.current = pathname;

    // Check if we've navigated to a different section
    const changedSection =
      previousPath &&
      ((previousPath.startsWith("/notes") && !pathname.startsWith("/notes")) ||
        (previousPath.startsWith("/goals") && !pathname.startsWith("/goals")) ||
        (previousPath.startsWith("/c/") && !pathname.startsWith("/c/")) ||
        (previousPath.startsWith("/mail") && !pathname.startsWith("/mail")) ||
        (previousPath.startsWith("/calendar") &&
          !pathname.startsWith("/calendar")) ||
        (previousPath.startsWith("/browser") &&
          !pathname.startsWith("/browser")));

    // Always reset custom headers when changing major sections
    if (
      changedSection &&
      (currentHeaderType === "custom" || window.__customHeaderJSX)
    ) {
      window.__customHeaderJSX = undefined;
    }

    if (pathname.startsWith("/c")) componentType = "chat";
    else if (pathname.startsWith("/mail")) componentType = "mail";
    else if (pathname.startsWith("/calendar")) componentType = "calendar";
    else if (pathname.startsWith("/browser")) componentType = "browser";
    else if (pathname === "/notes") componentType = "notes";
    else if (pathname === "/goals") componentType = "goals";
    // Don't override custom headers set by other components if still on the same section
    // BUT don't skip setting header if we're coming from a different section
    else if (
      !changedSection &&
      currentHeaderType === "custom" &&
      (pathname.startsWith("/notes") || pathname.startsWith("/goals"))
    ) {
      return; // Keep the current custom header
    }

    // Set the header type based on the path or reset to default when changing sections
    setHeader(componentType);
  }, [pathname, setHeader, currentHeaderType]);

  // If it's a custom header, render the stored JSX
  if (currentHeaderType === "custom" && window.__customHeaderJSX) {
    return <>{window.__customHeaderJSX}</>;
  }

  // Get component-specific props if they exist
  const componentSpecificProps = headerProps?.componentProps || {};

  // Render the appropriate component based on currentHeaderType
  switch (currentHeaderType) {
    case "chat":
      return <ChatHeader {...componentSpecificProps} />;
    case "mail":
      return <MailHeader {...componentSpecificProps} />;
    case "goals":
    case "notes":
      return <></>;
    case "calendar":
      return <DefaultHeader />;
    case "browser":
      return <BrowserHeader {...componentSpecificProps} />;
    case "default":
    default:
      return <DefaultHeader />;
  }
}
