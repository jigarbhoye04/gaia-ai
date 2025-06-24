import { MotionContainer } from "../../../../layouts/MotionContainer";
import GetStartedButton from "../shared/GetStartedButton";

export default function FinalSection() {
  return (
    <div className="relative z-1 m-0! flex min-h-[80vh] w-screen flex-col items-center justify-center p-5 sm:min-h-fit">
      <MotionContainer className="my-20 flex w-full max-w-7xl flex-col items-center justify-center gap-6 rounded-4xl bg-gradient-to-b from-zinc-900 to-zinc-950 sm:p-28">
        <div className="text-center text-4xl font-medium sm:text-6xl">
          Your Life, Supercharged by GAIA
        </div>
        <div className="max-w-(--breakpoint-md) text-center text-lg font-light text-foreground-500">
          Join thousands already upgrading their productivity.
        </div>

        <GetStartedButton small_text text="Sign Up" />
      </MotionContainer>
    </div>
  );
}
