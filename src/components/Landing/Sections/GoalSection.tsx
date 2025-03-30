import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
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
import { AnimatedSection } from "@/layouts/AnimatedSection";
import useMediaQuery from "@/hooks/useMediaQuery";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string | null;
}

export default function GoalSection() {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");

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
        title: "Create a Roadmap",
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
        image: isMobileScreen ? null : "/landing/goal_cropped.webp",
      },
    ],
    [isMobileScreen],
  );

  const [selectedImage, setSelectedImage] = useState<string | null>(
    steps[selectedStep].image,
  );

  useEffect(() => {
    steps.forEach((step) => {
      if (step.image) new Image().src = step.image;
    });
  }, [steps]);

  return (
    <div className="flex min-h-fit w-screen flex-col items-center gap-5 p-4 transition-all sm:mt-0">
      <GoalHeader />
      <GoalSteps
        selectedStep={selectedStep}
        setSelectedImage={setSelectedImage}
        setSelectedStep={setSelectedStep}
        steps={steps}
        image={selectedImage}
      />
    </div>
  );
}

function GoalHeader() {
  return (
    <div className="max-w-screen-md text-center">
      <Chip variant="flat" color="primary">
        Goal Tracking
      </Chip>
      <h2 className="relative z-[2] mb-2 mt-4 flex items-center justify-center gap-4 text-4xl font-bold sm:text-5xl">
        Ever Felt Stuck Setting Goals?
      </h2>
    </div>
  );
}

interface GoalStepsProps {
  steps: Step[];
  selectedStep: number;
  setSelectedStep: React.Dispatch<React.SetStateAction<number>>;
  setSelectedImage: (image: string | null) => void;
  image: string | null;
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

  const [progresses, setProgresses] = useState<number[]>(steps.map(() => 0));

  useEffect(() => {
    if (selectedStep === 2 && isComplete) {
      setSelectedImage("/landing/goal_checked.webp");
    } else {
      setSelectedImage(steps[selectedStep].image || null);
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

  useEffect(() => {
    const progressDuration = 10000;
    const intervalTime = 50;
    const increment = 100 / (progressDuration / intervalTime);

    setProgresses((_prev) => {
      if (selectedStep === 0) {
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
    <div className="relative flex flex-col items-center gap-5">
      <div ref={goalSectionRef} className="min-w-full">
        <AnimatedSection className="grid w-full items-center justify-center px-2 sm:w-screen sm:max-w-screen-xl sm:grid-cols-3 sm:gap-5">
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
      className={`flex cursor-pointer flex-row items-center justify-center gap-7 rounded-3xl p-2 transition-all hover:opacity-100 sm:flex-col sm:items-start sm:gap-1 sm:p-5 ${
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
  image: string | null;
}

function GoalImage({ image }: GoalImageProps) {
  return !!image ? (
    <div className="relative h-[50vh] w-full">
      <NextImage
        fill={true}
        alt="Goal step illustration"
        // outline outline-4 outline-zinc-800
        className="min-h-[50vh] max-w-screen-sm rounded-3xl object-cover object-center transition-all sm:w-screen sm:max-w-screen-xl"
        src={image}
      />
      {image === "/landing/blur_goals.webp" && (
        <div className="absolute left-0 top-0 z-[2] flex h-full w-full items-center justify-center">
          <Input
            className="w-96"
            classNames={{ inputWrapper: "pr-2" }}
            endContent={
              <Button isIconOnly className="font-medium" color="primary">
                <Send />
              </Button>
            }
            label="What goal do you want to achieve?"
            variant="faded"
          />
        </div>
      )}
    </div>
  ) : null;
}
