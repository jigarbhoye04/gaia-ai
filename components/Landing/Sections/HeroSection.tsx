import { AnimatedSection } from "../../../layouts/AnimatedSection";

// import GradualSpacing from "../MagicUI/gradual-spacing";
// import WaitlistOnlyInput from "./WaitListIOnlyInput";
// import { Avatar, AvatarGroup } from "@heroui/avatar";
// import { cn } from "@/lib/utils";
import { AnimatedShinyText } from "@/components/ui/animated-shiny-text";
import { Spotlight } from "@/components/ui/spotlight-new";
import { cn } from "@/lib/utils";
import GetStartedButton from "../GetStartedButton";
// import { AnimatedShinyText } from "../../ui/animated-shiny-text";

export default function HeroSection() {
  return (
    <div
      className="flex flex-col w-screen justify-center items-center gap-8 sm:pt-28 pt-16 h-fit
    min-h-[55vh] 
    "
    >
      <div className="fixed top-0 left-0 w-screen">
        <Spotlight duration={15} />
      </div>
      <AnimatedSection className="flex flex-col justify-center items-center h-full z-[2] gap-4 relative" disableAnimation={false}>
        {/* <div className="tracking-[1rem] text-transparent bg-gradient-to-r via-white  bg-clip-text to-zinc-400 from-zinc-400">
          {/* INTRODUCING{"  "}GAIA 
        </div> 
          */}

        <div
          className={cn(
            "group rounded-full border text-base text-white transition-all ease-in hover:cursor-pointer border-white/5 bg-neutral-900 hover:bg-neutral-800"
          )}
        >
          <AnimatedShinyText className="inline-flex items-center justify-center px-4 py-1 transition ease-out hover:duration-300 hover:text-neutral-400">
            Currently in beta
          </AnimatedShinyText>
        </div>

        <AnimatedSection
          className="sm:text-8xl text-5xl bg-gradient-to-b from-white bg-clip-text text-center font-medium leading-none text-transparent to-zinc-400 max-w-screen-lg sm:-my-2 py-3" disableAnimation={false}
          childClassName="bg-gradient-to-b from-white to-zinc-400 bg-clip-text text-transparent inline-block px-3"
        >
          <span className="">Your </span>
          <span className="">Personal </span>
          <span className="">AI </span>
          <span className="">Assistant awaits.</span>
        </AnimatedSection>

        <div
          className="text-lg font-normal py-0 sm:px-0 px-4 leading-7 sm:text-xl
        text-white max-w-screen-sm text-center"
        >
          GAIA is your all-in-one personal assistant to help organise your life.
        </div>

        {/* <TypingAnimation
          className="text-lg font-normal py-0 sm:px-0 px-4 leading-7 sm:text-xl text-white max-w-screen-sm text-center"
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
