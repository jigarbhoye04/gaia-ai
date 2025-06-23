import { Spotlight } from "@/components/ui";
import { cn } from "@/lib/utils";

import { MotionContainer } from "../../../../layouts/MotionContainer";
import GetStartedButton from "../shared/GetStartedButton";

export default function HeroSection() {
  return (
    <div className="flex h-fit w-screen flex-col items-center justify-center gap-8 py-16 sm:py-28">
      <div className="top-0 left-0 w-screen">
        <Spotlight duration={15} />
      </div>
      <MotionContainer className="relative z-2 flex h-full flex-col items-center justify-center gap-4">
        <div
          // Gradient for text.
          className={cn(
            "group rounded-full border border-white/5 bg-neutral-900 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-800",
          )}
        />

        <div className="max-w-(--breakpoint-lg) bg-linear-to-b from-white to-zinc-400 bg-clip-text py-3 text-center text-[2.8rem] font-medium text-transparent sm:text-8xl">
          Meet the AI assistant that actually works
        </div>

        <div className="mb-6 max-w-(--breakpoint-sm) px-4 py-0 text-center text-lg leading-7 font-normal text-foreground-500 sm:px-0 sm:text-xl">
          One assistant. Every task. All in one place.
        </div>

        <GetStartedButton small_text />
      </MotionContainer>
    </div>
  );
}
