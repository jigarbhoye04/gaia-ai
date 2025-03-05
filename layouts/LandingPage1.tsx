"use client";

import { ReactNode } from "react";

import { cn } from "@/lib/utils";

interface Layout1Props {
  children: ReactNode;
  heading: string;
  subheading: string;
  icon?: ReactNode;
  extraHeading?: ReactNode;
  className?: string;
}

export default function LandingPage1Layout({
  children,
  heading,
  subheading,
  icon,
  extraHeading,
  className,
}: Layout1Props) {
  return (
    <div
      className={cn(
        "sm:h-full sm:min-h-fit flex flex-col justify-start items-center sm:gap-7 w-full p-4 bg-zinc-900 rounded-3xl outline outline-zinc-800 hover:outline-primary transition-all",
        className,
      )}
    >
      <div className="flex items-start flex-col justify-start gap-5 w-full">
        <div className="flex items-start gap-3 flex-col">
          {icon}
          <div>
            <h2 className="text-3xl font-semibold text-white">{heading}</h2>
            <p className="text-md text-gray-400">{subheading}</p>
          </div>
          {extraHeading}
        </div>
      </div>
      <div className="w-full p-3 sm:p-0 rounded-3xl space-y-5">{children}</div>
    </div>
  );
}
