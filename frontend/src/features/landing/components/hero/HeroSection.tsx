import ShinyText from "@/components/ui/shadcn/shimmering-chip";
import { MotionContainer } from "@/layouts/MotionContainer";

import GetStartedButton from "../shared/GetStartedButton";

export default function HeroSection() {
  return (
    <div className="flex h-fit w-screen flex-col items-center justify-center gap-8 py-16 sm:pt-40 sm:pb-26">
      {/* <div className="top-0 left-0 w-screen">
        <Spotlight duration={15} />
      </div> */}
      <MotionContainer className="relative z-2 flex h-full flex-col items-center justify-center gap-4">
        <ShinyText
          text="Currently in Public Beta"
          speed={3}
          className="relative z-10 cursor-pointer rounded-full bg-zinc-900 p-1 px-3 text-sm font-light outline-1 outline-zinc-700"
        />
        {/* bg-linear-to-b from-white to-zinc-400 bg-clip-text text-transparent */}
        <div className="max-w-(--breakpoint-md) py-3 text-center text-[2.8rem] font-medium text-zinc-300 sm:text-7xl">
          Meet the AI assistant that actually works
        </div>
        <div className="mb-6 max-w-(--breakpoint-sm) px-4 py-0 text-center text-lg leading-7 font-light text-foreground-500 sm:px-0 sm:text-lg">
          {/* One assistant. Every task. All in one place. */}
          Tired of Siri, Google Assistant, and ChatGPT doing nothing useful?
        </div>
        <GetStartedButton />
      </MotionContainer>
    </div>
  );
}
