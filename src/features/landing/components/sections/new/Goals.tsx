import { Chip } from "@heroui/chip";

import { FeatureCard } from "../../shared/FeatureCard";
import LargeHeader from "../../shared/LargeHeader";

interface TodoTool {
  title: string;
  description: string;
}

export default function Goals() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-10">
      <LargeHeader
        headingText="Never Feel Lost After Setting a Goal Again"
        subHeadingText={
          "GAIA turns your goals into step-by-step roadmaps, and adds them to your todo list — so you always know what to do next."
        }
      />
      <div className="grid h-full w-full max-w-6xl grid-cols-3 grid-rows-2 gap-5">
        <FeatureCard
          childrenBeforeHeading={
            <div className="mb-2">
              <Chip
                color="primary"
                variant="flat"
                size="lg"
                className="text-primary"
              >
                Step 1
              </Chip>
            </div>
          }
          imageSrc="/landing/goals/chat.png"
          title="Describe your goal"
          description="Define your objective clearly so GAIA can create a personalized & actionable plan for you."
          reverse
        />

        <FeatureCard
          childrenBeforeHeading={
            <div className="mb-2">
              <Chip
                color="primary"
                variant="flat"
                size="lg"
                className="text-primary"
              >
                Step 2
              </Chip>
            </div>
          }
          imageSrc="/landing/goals/roadmap.png"
          title="Create a Roadmap"
          description="GAIA automatically provides a step-by-step plan with resources to help you achieve your goal!"
          reverse
        />

        <FeatureCard
          childrenBeforeHeading={
            <div className="mb-2">
              <Chip
                color="primary"
                variant="flat"
                size="lg"
                className="text-primary"
              >
                Step 1
              </Chip>
            </div>
          }
          imageSrc="/landing/goals/chat.png"
          title="Describe your goal"
          description="Define your objective clearly so GAIA can create a personalized & actionable plan for you."
          reverse
        />
      </div>
    </div>
  );
}
