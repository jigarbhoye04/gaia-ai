import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Send } from "lucide-react";
import NextImage from "next/image";
import React, { useEffect, useMemo, useRef, useState } from "react";

import StaticSidebar from "@/components/Landing/Dummy/DummySidebar";
import {
  CheckmarkSquare03Icon,
  FlowchartIcon1,
  Target02Icon,
} from "@/components/Misc/icons";

import { AnimatedSection } from "../../../layouts/AnimatedSection";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
}

export default function GoalSection() {
  const [selectedStep, setSelectedStep] = useState<number>(0);

  const steps = useMemo<Step[]>(
    () => [
      {
        icon: <Target02Icon color={undefined} height={30} width={30} />,
        title: "Enter your goal",
        description:
          "Define your objective clearly so we can create a personalized plan for you.",
        image: "/landing/blur_goals.webp",
      },
      {
        icon: <FlowchartIcon1 color={undefined} height={30} width={30} />,
        title: "Create a Flowchart",
        description:
          "GAIA provides a step-by-step plan with resources to help you achieve your goal!",
        image: "/landing/goal_tracking.webp",
      },
      {
        icon: (
          <CheckmarkSquare03Icon color={undefined} height={30} width={30} />
        ),
        title: "Keep Track",
        description:
          "Monitor your milestones and celebrate every step toward achieving your goal.",
        image: "/landing/goal_cropped.webp",
      },
    ],
    [],
  );

  const [selectedImage, setSelectedImage] = useState<string>(
    steps[selectedStep].image,
  );

  useEffect(() => {
    // Preload all step images.
    steps.forEach((step) => {
      new Image().src = step.image;
    });
  }, [steps]);

  return (
    <AnimatedSection className="flex min-h-fit w-screen flex-col items-center gap-5 p-4 transition-all sm:mt-0">
      <GoalHeader />
      <GoalSteps
        selectedStep={selectedStep}
        setSelectedImage={setSelectedImage}
        setSelectedStep={setSelectedStep}
        steps={steps}
        image={selectedImage}
      />
    </AnimatedSection>
  );
}

function GoalHeader() {
  return (
    <div className="max-w-screen-md text-center">
      <h2 className="mb-2 flex items-center justify-center gap-4 text-4xl font-bold sm:text-5xl">
        Ever Felt Stuck Setting Goals?
      </h2>
      {/* <p className="text-foreground-700 text-lg">
        GAIA makes it easy by creating a step-by-step plan just for you. Enter
        your goal, and GAIA will break it down into clear actions with timelines
        and helpful resources to keep you on track.
      </p> */}
    </div>
  );
}

interface GoalStepsProps {
  steps: Step[];
  selectedStep: number;
  setSelectedStep: React.Dispatch<React.SetStateAction<number>>;
  setSelectedImage: (image: string) => void;
  image: string;
}

function GoalSteps({
  steps,
  selectedStep,
  setSelectedStep,
  setSelectedImage,
  image,
}: GoalStepsProps) {
  const [isComplete, setIsComplete] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const goalSectionRef = useRef<HTMLDivElement>(null);

  // Progress array for each step.
  const [progresses, setProgresses] = useState<number[]>(steps.map(() => 0));

  useEffect(() => {
    // Update the displayed image.
    if (selectedStep === 2 && isComplete) {
      setSelectedImage("/landing/goal_checked.webp");
    } else {
      setSelectedImage(steps[selectedStep].image);
    }
  }, [isComplete, selectedStep, steps, setSelectedImage]);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        setIsVisible(entry.isIntersecting);
      },
      { threshold: 0.1 },
    );

    if (goalSectionRef.current) observer.observe(goalSectionRef.current);
  }, []);

  // Animate progress for the active step.
  useEffect(() => {
    const progressDuration = 10000; // Duration for each step in ms.
    const intervalTime = 50; // Update interval in ms.
    const increment = 100 / (progressDuration / intervalTime);

    // When the active step changes, set previous steps as complete (if moving forward) and reset current.
    setProgresses((_prev) => {
      if (selectedStep === 0) {
        // Reset all on a cycle restart.
        return steps.map(() => 0);
      } else {
        return steps.map((_, index) =>
          index < selectedStep ? 100 : index === selectedStep ? 0 : 0,
        );
      }
    });

    const interval = setInterval(() => {
      setProgresses((prev) => {
        const newProgresses = [...prev];
        if (newProgresses[selectedStep] < 100) {
          newProgresses[selectedStep] = Math.min(
            newProgresses[selectedStep] + increment,
            100,
          );
        }
        return newProgresses;
      });
    }, intervalTime);

    const timeout = setTimeout(() => {
      // Mark the current step as complete.
      setProgresses((prev) => {
        const newProgresses = [...prev];
        newProgresses[selectedStep] = 100;
        return newProgresses;
      });
      setSelectedStep((prevStep: number) => (prevStep + 1) % steps.length);
    }, progressDuration);

    return () => {
      clearInterval(interval);
      clearTimeout(timeout);
    };
  }, [selectedStep, steps, setSelectedStep]);

  return (
    <div className="space-y-5">
      <div ref={goalSectionRef} className="min-w-full">
        <AnimatedSection className="grid w-screen max-w-screen-xl items-center justify-center sm:grid-cols-3 sm:gap-5">
          {steps.map((step, index) => (
            <GoalStep
              key={index}
              index={index + 1}
              isSelected={selectedStep === index}
              onClick={() => setSelectedStep(index)}
              progress={progresses[index]}
              {...step}
            />
          ))}
        </AnimatedSection>
      </div>

      <GoalImage image={image} />

      <StaticSidebar
        isComplete={isComplete}
        isVisible={selectedStep === 2 && isVisible}
        setIsComplete={setIsComplete}
      />
    </div>
  );
}

interface GoalStepProps extends Step {
  index: number;
  isSelected: boolean;
  onClick: () => void;
  progress: number;
}

function GoalStep({
  icon,
  title,
  description,
  index,
  isSelected,
  onClick,
  progress,
}: GoalStepProps) {
  return (
    <div
      className={`flex cursor-pointer flex-row items-start justify-start gap-1 rounded-3xl p-2 transition-all hover:opacity-100 sm:flex-col sm:p-5 ${
        isSelected ? "opacity-100" : "sm:opacity-60"
      }`}
      onClick={onClick}
    >
      <div
        className={`outline outline-2 ${
          isSelected
            ? "bg-primary text-black/90 outline-black/90"
            : "bg-zinc-800 text-white outline-zinc-700"
        } relative mb-5 flex min-h-[50px] min-w-[50px] items-center justify-center rounded-xl`}
      >
        {icon}
        <div className="absolute -bottom-1 -right-1 flex min-h-5 min-w-5 items-center justify-center rounded-full bg-primary text-sm font-bold text-black">
          {index}
        </div>
      </div>
      <div className="flex max-w-fit flex-col items-start sm:items-start">
        <h3 className="text-start text-xl font-bold sm:text-start">{title}</h3>
        <p className="w-full text-start text-foreground-500 sm:text-start">
          {description}
        </p>
        {/* Each step’s progress bar */}
        <div className="mt-3 h-[2px] w-full overflow-hidden rounded-md bg-[rgba(0,187,255,0.1)]">
          <div
            className="h-full bg-primary transition-all duration-100 ease-in-out"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>
    </div>
  );
}

interface GoalImageProps {
  image: string;
}

function GoalImage({ image }: GoalImageProps) {
  return (
    <div className="relative hidden h-[50vh] sm:flex">
      <NextImage
        fill={true}
        alt="Goal step illustration"
        className="min-h-[50vh] max-w-screen-sm rounded-3xl object-cover object-center outline outline-4 outline-zinc-800 transition-all sm:w-screen sm:max-w-screen-xl"
        src={image}
      />
      {image === "/landing/blur_goals.webp" && (
        <div className="absolute left-0 top-0 z-[2] flex h-full w-full items-center justify-center">
          <Input
            className="w-96"
            classNames={{ inputWrapper: "pr-2" }}
            endContent={
              <Button
                isIconOnly
                className="font-medium"
                color="primary"
                // onPress={handleAddGoal}
              >
                <Send />
              </Button>
            }
            label="What goal do you want to achieve?"
            variant="faded"
            // value={goalTitle}
            // onChange={(e: { target: { value: SetStateAction<string> } }) =>
            //   setGoalTitle(e.target.value)
            // }
            // onKeyDown={handleKeyPress}
          />
        </div>
      )}
    </div>
  );
}
