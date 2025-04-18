// import GradualSpacing from "../MagicUI/gradual-spacing";
// import WaitlistOnlyInput from "./WaitListIOnlyInput";
// import { Avatar, AvatarGroup } from "@heroui/avatar";
// import { cn } from "@/lib/utils";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Spotlight } from "@/components/ui/spotlight-new";
import { cn } from "@/lib/utils";

import { AnimatedSection } from "../../../layouts/AnimatedSection";
import GetStartedButton from "../GetStartedButton";
// import { AnimatedShinyText } from "../../ui/animated-shiny-text";

export default function HeroSection() {
  return (
    <div className="flex h-fit min-h-[55vh] w-screen flex-col items-center justify-center gap-8 pt-16 sm:pt-28">
      <div className="fixed left-0 top-0 w-screen">
        <Spotlight duration={15} />
      </div>
      <AnimatedSection className="relative z-2 flex h-full flex-col items-center justify-center">
        {/* <div className="tracking-[1rem] text-transparent bg-linear-to-r via-white  bg-clip-text to-zinc-400 from-zinc-400">
          {/* INTRODUCING{"  "}GAIA 
        </div> 
          */}

        <div
          className={cn(
            "group rounded-full border border-white/5 bg-neutral-900 text-base text-white transition-all ease-in hover:cursor-pointer hover:bg-neutral-800",
          )}
        >
          <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:text-neutral-400 hover:duration-300">
            Currently in beta
          </AnimatedShinyText>
        </div>

        <AnimatedSection
          className="max-w-(--breakpoint-lg) bg-linear-to-b from-white to-zinc-400 bg-clip-text py-3 text-center text-[2.8rem] font-medium leading-none text-transparent sm:-my-2 sm:text-8xl"
          childClassName="bg-linear-to-b from-white to-zinc-400 bg-clip-text text-transparent inline-block px-1"
        >
          <span>Your </span>
          <span>Personal </span>
          <span>AI </span>
          <span>Assistant awaits.</span>
        </AnimatedSection>

        <div className="max-w-(--breakpoint-sm) px-4 py-0 text-center text-lg font-normal leading-7 text-white sm:px-0 sm:text-xl">
          GAIA is your all-in-one personal assistant to help organise your life.
        </div>

        {/* <TypingAnimation
          className="text-lg font-normal py-0 sm:px-0 px-4 leading-7 sm:text-xl text-white max-w-(--breakpoint-sm) text-center"
          duration={8}
          text={
            // "GAIA is your all-in-one personal assistant for seamless calendar management, goal tracking, and more."
            // "GAIA is your one stop solution personal assistant that helps with everything from calendar management to goal tracking"
            "GAIA is your all-in-one personal assistant to help organise your life."
          }
        /> */}
        <GetStartedButton />
      </AnimatedSection>
    </div>
  );
}
