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

export default function LandingSectionLayout({
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
        "flex w-full flex-col items-center justify-start rounded-3xl bg-zinc-900 p-4 outline outline-zinc-800 transition-all hover:outline-primary sm:h-full sm:min-h-fit sm:gap-7",
        className,
      )}
    >
      <div className="flex w-full flex-col items-start justify-start gap-5">
        <div className="flex flex-col items-start gap-3">
          {icon}
          <div>
            <h2 className="text-3xl font-semibold text-white">{heading}</h2>
            <p className="text-md text-gray-400">{subheading}</p>
          </div>
          {extraHeading}
        </div>
      </div>
      <div className="w-full space-y-5 rounded-3xl p-3 sm:p-0">{children}</div>
    </div>
  );
}
