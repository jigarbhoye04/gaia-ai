import ShinyText from "@/components/ui/shadcn/shimmering-chip";
import { MotionContainer } from "@/layouts/MotionContainer";
import GetStartedButton from "../shared/GetStartedButton";
import { SplitTextBlur } from "./SplitTextBlur";
export default function HeroSection() {
  return (
    <div className="sti h-[] mt-[20vh] w-screen flex-col gap-8 py-16 sm:pb-26">
      {/* <div className="top-0 left-0 w-screen">
        <Spotlight duration={15} />
      </div> */}

      {/* Gradient */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_rgba(15,15,15,0.9),_rgba(9,9,11,1)),linear-gradient(to_bottom,_#0c0c0c,_#0a0a0a)] bg-fixed" />
      {/* Grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808005_1px,transparent_1px),linear-gradient(to_bottom,#80808005_1px,transparent_1px)] bg-[size:32px_32px]" />

      {/* Hero section gradient */}
      <div className="particles absolute top-0 h-screen w-full overflow-hidden bg-[#00bbff40] bg-[radial-gradient(circle,_#00bbff70_0%,_#00bbff_36%,_#00bbff50_70%)]">
        <div className="vignette absolute h-[351%] w-full bg-[radial-gradient(circle,_rgba(0,0,0,0)_0%,_rgba(0,0,0,0.57)_47%,_rgba(0,0,0,1)_80%)]" />
      </div>

      <MotionContainer className="top-10 z-2 flex h-full flex-col items-center justify-start gap-4">
        <ShinyText
          text="Currently in Public Beta"
          speed={5}
          className="relative z-10 cursor-pointer rounded-full bg-zinc-900 p-1 px-4 text-sm font-light outline-1 outline-zinc-800"
        />
        <SplitTextBlur
          text="Meet the AI assistant that actually works"
          className="max-w-(--breakpoint-md) py-3 text-center text-[2.8rem] leading-tight font-medium text-white sm:text-[4rem]"
        />
        <div className="mb-6 max-w-(--breakpoint-sm) px-4 py-0 text-center text-lg leading-7 font-light text-foreground-500 sm:px-0 sm:text-lg">
          Tired of Siri, Google Assistant, and ChatGPT doing nothing useful?
        </div>
        <GetStartedButton />
      </MotionContainer>

      {/* <div className="mt-">
        <HeroImage />
      </div> */}
    </div>
  );
}
