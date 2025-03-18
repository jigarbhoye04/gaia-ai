import { ReactNode } from "react";

import { cn } from "@/lib/utils";

export function SimpleChatBubbleUser({
  children,
  hideMobile = false,
  className = "",
}: {
  children: any;
  hideMobile?: boolean;
  className?: string;
}) {
  if (hideMobile) return <></>;

  return (
    <div className={`chat_bubble_container user ${className}`}>
      <div className="chat_bubble user !select-none whitespace-pre-wrap">
        {/* <div className="flex select-text text-wrap max-w-[30vw]"> */}
        {children}
        {/* </div> */}
      </div>
    </div>
  );
}

export function SimpleChatBubbleBot({
  className,
  children,
  parentClassName,
}: {
  children: ReactNode;
  className?: string;
  parentClassName?: string;
}) {
  return (
    <div className={`relative flex items-end gap-3 ${parentClassName}`}>
      {/* <div className="pingspinner relative" /> */}
      <div className={cn("chat_bubble !select-none bg-zinc-800", className)}>
        {children}
      </div>
    </div>
  );
}
