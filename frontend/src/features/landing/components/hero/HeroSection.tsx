import ShinyText from "@/components/ui/shadcn/shimmering-chip";
import { MotionContainer } from "@/layouts/MotionContainer";

import GetStartedButton from "../shared/GetStartedButton";
import { SplitTextBlur } from "./SplitTextBlur";
export default function HeroSection() {
  return (
    <div className="sti h-[] mt-[80px] w-screen flex-col gap-8 py-16 sm:pb-26">
      {/* <div className="top-0 left-0 w-screen">
        <Spotlight duration={15} />
      </div> */}

        
<div className="particles z-1 absolute top-0 h-screen w-full overflow-hidden bg-[#01bbff1a] bg-[radial-gradient(circle_at_center,_#01bbff40_0%,_#01bbff26_40%,_#01bbff0d_75%,_transparent_100%)]">
  <div className="vignette absolute h-[351%] w-full bg-[radial-gradient(circle,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0)_47%,_rgba(0,0,0,1)_80%)]" />
</div>


        {/* <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(15,15,15,0.9),_rgba(9,9,11,1)),linear-gradient(to_bottom,_#0c0c0c,_#0a0a0a)] bg-fixed" /> */}
        {/* <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,187,255,0.07),transparent_50%)]" /> */}
        <div className="absolute z-2 inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
        

      {/* <div className="particles w-full h-screen overflow-hidden bg-[#388EFF] bg-[radial-gradient(circle,_rgba(56,142,255,1)_0%,_rgba(69,125,255,1)_36%,_rgba(13,17,46,1)_70%)]  absolute top-0">
        
        <div className="vignette w-full h-[351%] absolute bg-[radial-gradient(circle,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.57)_47%,_rgba(0,0,0,1)_80%)]">

        </div>
      </div> */}

      {/* <SoftMovingGradient 
      className="z-[999999]"
      /> */}

      <MotionContainer className="relative z-2 flex h-full  flex-col items-center justify-start gap-4 ">
        <ShinyText
          text="Currently in Public Beta"
          speed={10}
          className="relative z-10 cursor-pointer rounded-full p-2 px-4 text-sm font-light outline-1 outline-zinc-700"
        />
        {/* bg-linear-to-b from-white to-zinc-400 bg-clip-text text-transparent */}
        {/* <div className="max-w-(--breakpoint-md) py-3 text-center text-[2.8rem] font-medium text-zinc-300 sm:text-7xl">
          Meet the AI assistant that actually works
        </div> */}
        
        <SplitTextBlur
          text="Meet the AI assistant that actually works"
          className="max-w-(--breakpoint-md) py-3 text-center text-[2.8rem] font-medium text-white sm:text-7xl"
        />
        <div className="mb-6 max-w-(--breakpoint-sm) px-4 py-0 text-center text-lg leading-7 font-light text-foreground-500 sm:px-0 sm:text-lg">
          {/* One assistant. Every task. All in one place. */}
          Tired of Siri, Google Assistant, and ChatGPT doing nothing useful?
        </div>
        <GetStartedButton />
        
      </MotionContainer>
    </div>
  );
}
