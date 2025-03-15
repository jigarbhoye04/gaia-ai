import React, { useEffect, useRef, useState } from "react";
import { Input } from "@heroui/input";
import { Button } from "@heroui/button";
import { Send } from "lucide-react";

import { AnimatedSection } from "../../../layouts/AnimatedSection";

import {
  CheckmarkSquare03Icon,
  FlowchartIcon1,
  Target02Icon,
} from "@/components/Misc/icons";
import StaticSidebar from "@/components/Landing/Dummy/DummySidebar";

interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  image: string;
}

export default function GoalSection(): JSX.Element {
  const [selectedStep, setSelectedStep] = useState<number>(0);
  const steps: Step[] = [
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
      icon: <CheckmarkSquare03Icon color={undefined} height={30} width={30} />,
      title: "Keep Track",
      description:
        "Monitor your milestones and celebrate every step toward achieving your goal.",
      image: "/landing/goal_cropped.webp",
    },
  ];
  const [selectedImage, setSelectedImage] = useState<string>(
    steps[selectedStep].image
  );

  useEffect(() => {
    // Preload all step images.
    steps.forEach((step) => {
      new Image().src = step.image;
    });
  }, [steps]);

  return (
    <AnimatedSection className="flex w-screen flex-col items-center min-h-fit transition-all p-4 sm:mt-0 gap-5 " disableAnimation={false}>
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

function GoalHeader(): JSX.Element {
  return (
    <div className="text-center max-w-screen-md">
      <h2 className="sm:text-5xl text-4xl font-bold flex items-center gap-4 mb-2 justify-center">
        Need help setting goals?
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
}: GoalStepsProps): JSX.Element {
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
      { threshold: 0.1 }
    );

    if (goalSectionRef.current) {
      observer.observe(goalSectionRef.current);
    }

    return () => {
      if (goalSectionRef.current) {
        observer.unobserve(goalSectionRef.current);
      }
    };
  }, []);

  // Animate progress for the active step.
  useEffect(() => {
    const progressDuration = 10000; // Duration for each step in ms.
    const intervalTime = 50; // Update interval in ms.
    const increment = 100 / (progressDuration / intervalTime);

    // When the active step changes, set previous steps as complete (if moving forward) and reset current.
    setProgresses((prev) => {
      if (selectedStep === 0) {
        // Reset all on a cycle restart.
        return steps.map(() => 0);
      } else {
        return steps.map((_, index) =>
          index < selectedStep ? 100 : index === selectedStep ? 0 : 0
        );
      }
    });

    const interval = setInterval(() => {
      setProgresses((prev) => {
        const newProgresses = [...prev];
        if (newProgresses[selectedStep] < 100) {
          newProgresses[selectedStep] = Math.min(
            newProgresses[selectedStep] + increment,
            100
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
        <AnimatedSection className="grid w-screen max-w-screen-xl sm:grid-cols-3 items-center justify-center sm:gap-5"
          disableAnimation={false}
        >
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
}: GoalStepProps): JSX.Element {
  return (
    <div
      className={`flex items-start gap-1 sm:p-5 p-2 sm:flex-col flex-row justify-start rounded-3xl cursor-pointer transition-all hover:opacity-100 ${isSelected ? "opacity-100" : "sm:opacity-60"
        }`}
      onClick={onClick}
    >
      <div
        className={` outline outline-2 ${isSelected
          ? "outline-black/90 text-black/90 bg-primary"
          : " outline-zinc-700 text-white bg-zinc-800"
          } min-w-[50px] min-h-[50px] rounded-xl flex items-center justify-center relative mb-5`}
      >
        {icon}
        <div className="bg-primary rounded-full min-w-5 min-h-5 text-sm font-bold text-black flex items-center justify-center absolute -bottom-1 -right-1">
          {index}
        </div>
      </div>
      <div className="flex flex-col sm:items-start items-start max-w-fit">
        <h3 className="text-xl font-bold sm:text-start text-start">{title}</h3>
        <p className="sm:text-start text-start text-foreground-500 w-full">
          {description}
        </p>
        {/* Each step’s progress bar */}
        <div className="w-full h-[2px] bg-[rgba(0,187,255,0.1)] rounded-md overflow-hidden mt-3">
          <div
            className="h-full bg-primary transition-all ease-in-out duration-100"
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

function GoalImage({ image }: GoalImageProps): JSX.Element {
  return (
    <div className="relative sm:flex hidden">
      <img
        alt="Goal step illustration"
        className="h-[50vh] sm:w-screen max-w-screen-sm sm:max-w-screen-xl object-center object-cover rounded-3xl transition-all outline outline-4 outline-zinc-800"
        src={image}
      />
      {image === "/landing/blur_goals.webp" && (
        <div className="absolute h-full w-full flex items-center justify-center z-[2] top-0 left-0">
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
