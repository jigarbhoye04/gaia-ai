import { AnimatedSection } from "../../../layouts/AnimatedSection";
import GetStartedButton from "../GetStartedButton";

export default function FinalSection() {
  return (
    <div className="flex w-screen items-center flex-col !m-0 sm:p-36 p-5 sm:min-h-fit min-h-[50vh] z-[1] relative bg-gradient-to-t from-[#00bbff50] justify-center">
      <AnimatedSection className="flex w-full flex-col items-center gap-3 justify-center"
        disableAnimation={false}
      >
        <div className="sm:text-6xl text-6xl font-medium text-center">
          Get Started for Free
        </div>
        <div className="text-lg text-foreground-700 text-center max-w-screen-sm">
          GAIA is your intelligent assistant, designed to help you organize your
          life, track your goals, and enhance productivity effortlessly.
          Experience the future of AI-driven assistance today.
        </div>

        <GetStartedButton />
      </AnimatedSection>
    </div>
  );
}
