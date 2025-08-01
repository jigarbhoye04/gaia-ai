import {
  CheckCircle,
  CheckCircle2,
  Clock,
  GitBranch,
  Send,
  Target,
} from "lucide-react";
import React, { useCallback,useEffect, useRef, useState } from "react";

import { Target02Icon } from "@/components";

// Helper to wait for a specific duration
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

// --- Step Definitions ---
interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  demo: "chat" | "roadmap" | "tracking";
}

const steps: Step[] = [
  {
    icon: <Target02Icon className="h-5 w-5" color={undefined} />,
    title: "Enter your goal",
    description:
      "Define your objective clearly so we can create a personalized plan for you.",
    demo: "chat",
  },
  {
    icon: <GitBranch className="h-5 w-5" />,
    title: "Create a Roadmap",
    description:
      "Our AI provides a step-by-step plan to help you achieve your goal!",
    demo: "roadmap",
  },
  {
    icon: <CheckCircle className="h-5 w-5" />,
    title: "Keep Track",
    description:
      "Monitor your milestones and celebrate every step toward achieving your goal.",
    demo: "tracking",
  },
];

// --- Message Interface for Chat ---
interface Message {
  type: "user" | "ai";
  text: string;
}

// --- Chat Demo Component ---
const ChatDemo: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingText, setTypingText] = useState("");
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);

  const isMounted = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const runAnimation = useCallback(async () => {
    if (!isMounted.current || !isActive) return;

    const fullText = "I want to learn React in 3 months";

    // Reset state
    setMessages([]);
    setTypingText("");
    setIsAiTyping(false);
    setShowCursor(false);
    setAnimationComplete(false);

    await wait(800);
    if (!isMounted.current || !isActive) return;

    // Type out the user message
    setShowCursor(true);
    for (let i = 0; i <= fullText.length; i++) {
      if (!isMounted.current || !isActive) return;
      setTypingText(fullText.substring(0, i));
      await wait(60);
    }

    if (!isMounted.current || !isActive) return;
    setShowCursor(false);
    await wait(800);

    if (!isMounted.current || !isActive) return;
    setMessages([{ type: "user", text: fullText }]);
    setTypingText("");

    await wait(800);
    if (!isMounted.current || !isActive) return;
    setIsAiTyping(true);

    await wait(2000);
    if (!isMounted.current || !isActive) return;
    setIsAiTyping(false);
    setMessages((prev) => [
      ...prev,
      {
        type: "ai",
        text: "Perfect! I'll create a personalized React learning roadmap for you.",
      },
    ]);

    await wait(1500);
    if (!isMounted.current || !isActive) return;
    setAnimationComplete(true);
  }, [isActive]);

  useEffect(() => {
    isMounted.current = true;

    if (isActive) {
      timeoutRef.current = setTimeout(runAnimation, 500);
    } else {
      setMessages([]);
      setTypingText("");
      setIsAiTyping(false);
      setShowCursor(false);
      setAnimationComplete(false);
    }

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, runAnimation]);

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6 backdrop-blur-sm">
      <div className="mb-6 flex min-h-[180px] flex-1 flex-col justify-center space-y-4">
        {messages.map((message, index) => (
          <div
            key={index}
            className={`flex ${message.type === "user" ? "justify-end" : "justify-start"} duration-500 animate-in fade-in-0 slide-in-from-bottom-4`}
          >
            <div
              className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm transition-all duration-300 ${
                message.type === "user"
                  ? "bg-[#01BBFF] text-white shadow-lg shadow-[#01BBFF]/10"
                  : "border border-white/10 bg-slate-800/50 text-white"
              }`}
            >
              {message.text}
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex justify-start duration-300 animate-in fade-in-0 slide-in-from-bottom-4">
            <div className="rounded-2xl border border-white/10 bg-slate-800/50 px-4 py-3">
              <div className="flex space-x-1">
                <div className="h-2 w-2 animate-bounce rounded-full bg-[#01BBFF]"></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-[#01BBFF]"
                  style={{ animationDelay: "0.15s" }}
                ></div>
                <div
                  className="h-2 w-2 animate-bounce rounded-full bg-[#01BBFF]"
                  style={{ animationDelay: "0.3s" }}
                ></div>
              </div>
            </div>
          </div>
        )}
        {!messages.length && !isAiTyping && (
          <div className="flex h-full items-center justify-center text-sm text-gray-400">
            Waiting for your goal...
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-slate-800/30 p-3 transition-all duration-300">
        <div className="h-6 flex-1 bg-transparent px-2 py-1 text-sm text-white placeholder-gray-400 outline-none">
          {typingText}
          {showCursor && (
            <span className="ml-px inline-block h-4 w-px animate-pulse bg-[#01BBFF]"></span>
          )}
        </div>
        <button
          className="rounded-lg bg-[#01BBFF] p-2 text-white transition-all duration-200 hover:scale-105 hover:bg-[#01BBFF]/80 active:scale-95"
          aria-label="Send message"
        >
          <Send className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
};

// --- Roadmap Demo Component ---
interface RoadmapStep {
  title: string;
  duration: string;
}

const RoadmapDemo: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [currentStep, setCurrentStep] = useState(-1); // Start at -1 for initial state
  const [animationComplete, setAnimationComplete] = useState(false);
  const isMounted = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const roadmapSteps: RoadmapStep[] = [
    { title: "Learn JavaScript Basics", duration: "2 weeks" },
    { title: "Understand React Fundamentals", duration: "3 weeks" },
    { title: "Build First React App", duration: "2 weeks" },
    { title: "Learn State Management", duration: "2 weeks" },
    { title: "Create Portfolio Project", duration: "3 weeks" },
  ];

  const runAnimation = useCallback(async () => {
    if (!isMounted.current || !isActive) return;
    setCurrentStep(-1);
    setAnimationComplete(false);
    await wait(1000); // Initial delay before animation starts
    for (let i = 0; i < roadmapSteps.length; i++) {
      if (!isMounted.current || !isActive) return;
      setCurrentStep(i);
      await wait(1200); // Wait for each step
    }
    if (!isMounted.current || !isActive) return;
    setAnimationComplete(true);
    // Optionally reset or hold the final state
  }, [isActive, roadmapSteps.length]);

  useEffect(() => {
    isMounted.current = true;
    if (isActive) {
      timeoutRef.current = setTimeout(runAnimation, 500);
    } else {
      setCurrentStep(-1);
      setAnimationComplete(false);
    }
    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, runAnimation]);

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6 backdrop-blur-sm">
      <div className="mb-8 flex flex-shrink-0 items-center gap-2">
        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#01BBFF]">
          <Target className="h-4 w-4 text-white" />
        </div>
        <div>
          <h3 className="text-sm font-semibold text-white">
            Learn React in 3 Months
          </h3>
          <p className="text-xs text-gray-400">Your personalized roadmap</p>
        </div>
      </div>

      <div className="flex w-full flex-1 flex-col justify-center overflow-hidden">
        <div className="mx-auto w-full max-w-sm">
          {roadmapSteps.map((step, index) => {
            const isCompleted = animationComplete || index < currentStep;
            const isCurrent = index === currentStep;
            const isRightSide = index % 2 === 0;

            // Class definitions for styling based on state
            const nodeClasses = isCompleted
              ? "bg-green-400 border-green-400"
              : isCurrent
                ? "bg-[#01BBFF] border-[#01BBFF] animate-pulse"
                : "border-gray-600";

            const textClasses = isCompleted
              ? "text-green-400 line-through decoration-green-400/50"
              : isCurrent
                ? "text-[#01BBFF]"
                : "text-white";

            const connectorClasses = isCompleted
              ? "bg-green-400"
              : isCurrent
                ? "bg-[#01BBFF]"
                : "bg-gray-600";

            const verticalLineClasses =
              isCompleted || (isCurrent && index > 0 && index < currentStep + 1)
                ? "bg-green-400"
                : "bg-gray-600";

            return (
              <div
                key={index}
                className="grid h-24 grid-cols-[1fr_auto_1fr] items-center gap-x-4"
              >
                {/* Left Branch */}
                <div className={`text-right ${isRightSide ? "invisible" : ""}`}>
                  <div className="relative inline-block rounded-md border border-white/10 bg-black/20 px-3 py-2 shadow-lg">
                    <h4
                      className={`text-sm font-medium transition-colors duration-500 ${textClasses}`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-400">{step.duration}</p>
                    <div
                      className={`absolute top-1/2 left-full h-0.5 w-4 -translate-y-1/2 transition-colors duration-500 ${connectorClasses}`}
                    />
                  </div>
                </div>

                {/* Center Spine & Node */}
                <div className="relative flex h-full items-center">
                  <div
                    className={`absolute left-1/2 h-full w-0.5 -translate-x-1/2 transition-colors duration-500 ${index <= currentStep ? "bg-green-400" : "bg-gray-600"} ${index === 0 ? "top-1/2 h-1/2" : ""} ${index === roadmapSteps.length - 1 ? "bottom-1/2 h-1/2" : ""} `}
                  />

                  <div
                    className={`z-10 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full border-2 transition-all duration-500 ${nodeClasses}`}
                  >
                    {isCompleted && (
                      <CheckCircle2 className="h-3 w-3 text-white" />
                    )}
                    {isCurrent && (
                      <div className="h-2 w-2 rounded-full bg-white" />
                    )}
                  </div>
                </div>

                {/* Right Branch */}
                <div className={`text-left ${!isRightSide ? "invisible" : ""}`}>
                  <div className="relative inline-block rounded-md border border-white/10 bg-black/20 px-3 py-2 shadow-lg">
                    <h4
                      className={`text-sm font-medium transition-colors duration-500 ${textClasses}`}
                    >
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-400">{step.duration}</p>
                    <div
                      className={`absolute top-1/2 right-full h-0.5 w-4 -translate-y-1/2 transition-colors duration-500 ${connectorClasses}`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// --- Tracking Demo Component ---
const TrackingDemo: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [progress, setProgress] = useState(0);
  const [animationComplete, setAnimationComplete] = useState(false);

  const isMounted = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const runAnimation = useCallback(async () => {
    if (!isMounted.current || !isActive) return;

    setProgress(0);
    setAnimationComplete(false);

    await wait(1000);

    // Animate progress smoothly
    for (let i = 0; i <= 65; i++) {
      if (!isMounted.current || !isActive) return;
      setProgress(i);
      await wait(30);
    }

    if (!isMounted.current || !isActive) return;
    setAnimationComplete(true);
  }, [isActive]);

  useEffect(() => {
    isMounted.current = true;

    if (isActive) {
      timeoutRef.current = setTimeout(runAnimation, 500);
    } else {
      setProgress(0);
      setAnimationComplete(false);
    }

    return () => {
      isMounted.current = false;
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [isActive, runAnimation]);

  return (
    <div className="flex h-full w-full flex-col rounded-2xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6 backdrop-blur-sm">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-white">Progress Overview</h3>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="h-3 w-3" />
          <span>Week 6 of 12</span>
        </div>
      </div>

      <div className="flex flex-1 flex-col justify-center space-y-5">
        <div className="rounded-xl border border-white/5 bg-slate-800/30 p-4">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-sm text-white">Overall Progress</span>
            <span className="text-sm font-medium text-[#01BBFF]">
              {progress}%
            </span>
          </div>
          <div className="h-2 w-full rounded-full bg-slate-700">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[#01BBFF] to-cyan-400 transition-all duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3 text-center">
            <div className="text-lg font-bold text-green-400">2</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3 text-center">
            <div className="text-lg font-bold text-[#01BBFF]">1</div>
            <div className="text-xs text-gray-400">In Progress</div>
          </div>
          <div className="rounded-lg border border-white/5 bg-slate-800/30 p-3 text-center">
            <div className="text-lg font-bold text-gray-400">8</div>
            <div className="text-xs text-gray-400">Total Tasks</div>
          </div>
        </div>

        <div className="flex items-center gap-2 rounded-lg border border-green-400/20 bg-green-400/10 p-3">
          <CheckCircle className="h-4 w-4 text-green-400" />
          <span className="text-sm text-green-400">
            Milestone: React Fundamentals ✓
          </span>
        </div>
      </div>
    </div>
  );
};

// --- Step Card Component ---
interface StepCardProps {
  step: Step;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

const StepCard: React.FC<StepCardProps> = ({
  step,
  index,
  isActive,
  onClick,
}) => (
  <div
    onClick={onClick}
    className={`relative cursor-pointer overflow-hidden rounded-3xl border p-7 backdrop-blur-sm transition-all duration-300 ${
      isActive
        ? "border-[#00BBFF]/50 bg-gradient-to-br from-white/[0.02] to-transparent shadow-xs shadow-[#01BBFF]/10"
        : "border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent hover:border-white/10"
    }`}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label={`Step ${index + 1}: ${step.title}`}
  >
    <div className="flex items-start gap-5">
      <div
        className={`relative flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-xl transition-all duration-300 ${
          isActive
            ? "bg-[#00BBFF] text-white"
            : "border border-white/10 bg-slate-800/50 text-gray-400"
        }`}
      >
        {step.icon}
        <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white ring-2 ring-slate-800/80">
          {index + 1}
        </div>
      </div>

      <div className="flex-1 pt-1">
        <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
        <p className="text-sm leading-relaxed text-gray-400">
          {step.description}
        </p>
      </div>
    </div>
  </div>
);

// --- Main Goals Component ---
const Goals: React.FC = () => {
  const [activeStep, setActiveStep] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);

  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isMounted = useRef(true);

  const switchToNextStep = useCallback(() => {
    if (!isMounted.current || !isAutoPlaying) return;
    setActiveStep((prev) => (prev + 1) % steps.length);
  }, [isAutoPlaying]);

  const handleStepClick = useCallback(
    (index: number) => {
      if (index === activeStep) return;

      setIsAutoPlaying(false);
      setActiveStep(index);

      // Clear current interval
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }

      // Resume auto-play after user interaction
      setTimeout(() => {
        if (isMounted.current) {
          setIsAutoPlaying(true);
        }
      }, 10000);
    },
    [activeStep],
  );

  useEffect(() => {
    isMounted.current = true;

    if (isAutoPlaying) {
      intervalRef.current = setInterval(switchToNextStep, 8000);
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isAutoPlaying, switchToNextStep]);

  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);

  const renderDemo = () => {
    const currentDemo = steps[activeStep].demo;
    return (
      <div className="h-full w-full transition-all duration-500 ease-in-out">
        {currentDemo === "chat" && <ChatDemo isActive={activeStep === 0} />}
        {currentDemo === "roadmap" && (
          <RoadmapDemo isActive={activeStep === 1} />
        )}
        {currentDemo === "tracking" && (
          <TrackingDemo isActive={activeStep === 2} />
        )}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(ellipse_at_top_left,_rgba(15,15,15,0.9),_rgba(9,9,11,1)),linear-gradient(to_bottom,_#0c0c0c,_#0a0a0a)] bg-cover bg-fixed bg-no-repeat">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,187,255,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 container mx-auto max-w-7xl py-12 sm:py-16">
        {/* Header */}
        <header className="mb-12 text-center">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#01BBFF]/30 bg-gradient-to-r from-[#01BBFF]/20 to-[#01BBFF]/10 px-4 py-2 backdrop-blur-sm">
            <div className="h-2 w-2 animate-pulse rounded-full bg-[#01BBFF]" />
            <span className="text-sm font-medium text-[#01BBFF]">
              Goal Tracking
            </span>
          </div>

          {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent mb-6 leading-tight">
            Ever Felt Stuck Setting&nbsp;
            <span className="bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent">
              Goals
            </span>
            ?
          </h1> */}

          <div className="relative mb-6">
            <h1 className="relative z-10 bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-5xl lg:text-6xl">
              Ever Felt Stuck Setting&nbsp;
              <span className="bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent">
                Goals ?
              </span>
            </h1>
            <h1 className="pointer-events-none absolute inset-0 bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-4xl font-bold text-transparent opacity-20 blur-lg select-none md:text-5xl lg:text-6xl">
              Ever Felt Stuck Setting&nbsp; Goals ?
            </h1>
          </div>

          <p className="mx-auto max-w-3xl text-lg leading-relaxed text-gray-400 md:text-xl">
            Our intelligent platform transforms your ambitions into actionable,
            easy-to-follow roadmaps. Achieve more, with clarity and focus.
          </p>
        </header>

        {/* Main Content */}
        <main className="grid items-start gap-10 lg:grid-cols-2 xl:gap-16">
          {/* Left Side: Demo Section */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-8">
              <div className="rounded-3xl border border-white/5 bg-gradient-to-br from-white/[0.02] to-transparent p-6 shadow-2xl shadow-black/20 backdrop-blur-sm">
                <div className="flex h-[420px] items-center justify-center">
                  {renderDemo()}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Steps Section */}
          <div className="order-1 space-y-8 lg:order-2">
            {steps.map((step, index) => (
              <StepCard
                key={index}
                step={step}
                index={index}
                isActive={activeStep === index}
                onClick={() => handleStepClick(index)}
              />
            ))}
          </div>
        </main>
      </div>
    </div>
  );
};

export default Goals;
