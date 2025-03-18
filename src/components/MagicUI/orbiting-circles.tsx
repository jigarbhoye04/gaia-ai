import React from "react";

import { cn } from "@/lib/utils";

export default function OrbitingCircles({
  className,
  children,
  reverse,
  duration = 20,
  delay = 10,
  radius = 50,
  path = true,
  bgcircle = true,
}: {
  className?: string;
  children?: React.ReactNode;
  reverse?: boolean;
  duration?: number;
  delay?: number;
  radius?: number;
  path?: boolean;
  bgcircle?: boolean;
}) {
  return (
    <>
      {path && (
        <svg
          className="pointer-events-none absolute inset-0 h-full w-full"
          version="1.1"
          xmlns="http://www.w3.org/2000/svg"
        >
          <circle
            className="stroke-black/10 stroke-1 dark:stroke-white/10"
            cx="50%"
            cy="50%"
            fill="none"
            r={radius}
            strokeDasharray={"4 4"}
          />
        </svg>
      )}

      <div
        className={cn(
          "absolute flex h-full w-full transform-gpu animate-orbit items-center justify-center rounded-full border [animation-delay:calc(var(--delay)*1000ms)] ",
          { "[animation-direction:reverse]": reverse },
          { "dark:bg-white/10  bg-black/10": bgcircle },
          className,
        )}
        style={
          {
            "--duration": duration,
            "--radius": radius,
            "--delay": -delay,
          } as React.CSSProperties
        }
      >
        {children}
      </div>
    </>
  );
}
