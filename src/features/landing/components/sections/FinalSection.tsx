import { MotionContainer } from "../../../../layouts/MotionContainer";
import GetStartedButton from "../shared/GetStartedButton";

export default function FinalSection() {
  return (
    <div className="relative z-1 m-0! flex min-h-[80vh] w-screen flex-col items-center justify-center p-5 sm:min-h-fit sm:p-36">
      <MotionContainer className="flex w-full flex-col items-center justify-center gap-3">
        <div className="text-center text-5xl font-bold sm:text-6xl">
          Get Started for Free
        </div>
        <div className="max-w-(--breakpoint-sm) text-center text-lg text-foreground-700">
          GAIA is your intelligent assistant, designed to help you organize your
          life, track your goals, and enhance productivity effortlessly.
          Experience the future of AI-driven assistance today.
        </div>

        <GetStartedButton small_text />
      </MotionContainer>
    </div>
  );
}
