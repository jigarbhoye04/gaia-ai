"use client";

import Image from "next/image";
import React, { forwardRef, useRef } from "react";

import { AnimatedBeam } from "@/components/magicui/animated-beam";
import {
  Brain02Icon,
  FileUploadIcon,
  GlobalSearchIcon,
  Gmail,
  GoogleCalendar,
  StickyNote01Icon,
  UserCircle02Icon,
} from "@/components/Misc/icons";
import { SectionHeading } from "@/layouts/LandingSectionHeading";
import { cn } from "@/lib/utils";

const Circle = forwardRef<
  HTMLDivElement,
  { className?: string; children?: React.ReactNode }
>(({ className, children }, ref) => {
  return (
    <div
      ref={ref}
      className={cn(
        "border-border z-10 flex size-12 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-800 p-3 shadow-[0_0_20px_-12px_rgba(0,0,0,0.8)]",
        className,
      )}
    >
      {children}
    </div>
  );
});

Circle.displayName = "Circle";

export default function AnimatedBeamMultipleOutputDemo({
  className,
}: {
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const div1Ref = useRef<HTMLDivElement>(null);
  const div2Ref = useRef<HTMLDivElement>(null);
  const div3Ref = useRef<HTMLDivElement>(null);
  const div4Ref = useRef<HTMLDivElement>(null);
  const div5Ref = useRef<HTMLDivElement>(null);
  const div6Ref = useRef<HTMLDivElement>(null);
  const div7Ref = useRef<HTMLDivElement>(null);

  return (
    <div className="relative z-[1] flex w-screen items-center justify-center">
      <div className="flex w-screen max-w-screen-xl flex-col items-start justify-evenly space-x-5 sm:flex-row sm:space-x-10">
        <div>
          <SectionHeading
            chipTitle="Multi-Context"
            heading="Seamless Integration"
            smallHeading
            subheading="Bringing together data from notes, file uploads, web searches, calendar events and more."
            icon={
              <Brain02Icon
                className="size-[35px] sm:size-[35px]"
                color="#9b9b9b"
              />
            }
          />
        </div>

        <div
          className={cn(
            "relative flex w-[40vw] items-center justify-center overflow-hidden",
            className,
          )}
          ref={containerRef}
        >
          <div className="flex size-full max-w-lg flex-row items-stretch justify-between gap-10">
            <div className="flex flex-col justify-center gap-2">
              <Circle ref={div1Ref} className="size-12 p-1">
                <StickyNote01Icon width={24} height={24} color="white" />
              </Circle>
              <Circle ref={div2Ref} className="size-12 p-1">
                <GlobalSearchIcon width={24} height={24} color="white" />
              </Circle>
              <Circle ref={div3Ref} className="size-12 p-1">
                <FileUploadIcon width={24} height={24} color="white" />
              </Circle>
              <Circle ref={div4Ref} className="size-12 p-1">
                <Gmail width={24} height={24} />
              </Circle>
              <Circle ref={div5Ref} className="size-12 p-1">
                <GoogleCalendar width={24} height={24} />
              </Circle>
            </div>
            <div className="flex flex-col justify-center">
              <Circle ref={div6Ref} className="size-[65px]">
                <Icons.gaia />
              </Circle>
            </div>
            <div className="flex flex-col justify-center">
              <Circle ref={div7Ref} className="size-10 p-1">
                <UserCircle02Icon width={50} height={50} color="white" />
              </Circle>
            </div>
          </div>

          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div1Ref}
            toRef={div6Ref}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div2Ref}
            toRef={div6Ref}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div3Ref}
            toRef={div6Ref}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div4Ref}
            toRef={div6Ref}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div5Ref}
            toRef={div6Ref}
          />
          <AnimatedBeam
            containerRef={containerRef}
            fromRef={div6Ref}
            toRef={div7Ref}
          />
        </div>
      </div>
    </div>
  );
}

const Icons = {
  gaia: () => (
    <Image
      src="/branding/logo.png"
      alt="GAIA Logo"
      width="80"
      height="80"
      style={{ objectFit: "contain" }}
    />
  ),
};
