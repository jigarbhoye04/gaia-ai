import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Target, GitBranch, CheckCircle, Send, Clock, CheckCircle2 } from 'lucide-react';

// Helper to wait for a specific duration
const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

// --- Step Definitions ---
interface Step {
  icon: React.ReactNode;
  title: string;
  description: string;
  demo: 'chat' | 'roadmap' | 'tracking';
}

const steps: Step[] = [
  {
    icon: <Target className="w-5 h-5" />,
    title: "Enter your goal",
    description: "Define your objective clearly so we can create a personalized plan for you.",
    demo: "chat"
  },
  {
    icon: <GitBranch className="w-5 h-5" />,
    title: "Create a Roadmap",
    description: "Our AI provides a step-by-step plan to help you achieve your goal!",
    demo: "roadmap"
  },
  {
    icon: <CheckCircle className="w-5 h-5" />,
    title: "Keep Track",
    description: "Monitor your milestones and celebrate every step toward achieving your goal.",
    demo: "tracking"
  }
];

// --- Message Interface for Chat ---
interface Message {
  type: 'user' | 'ai';
  text: string;
}

// --- Chat Demo Component ---
const ChatDemo: React.FC<{ isActive: boolean }> = ({ isActive }) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [typingText, setTypingText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [showCursor, setShowCursor] = useState(false);
  const [animationComplete, setAnimationComplete] = useState(false);
  
  const isMounted = useRef(true);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const runAnimation = useCallback(async () => {
    if (!isMounted.current || !isActive) return;
    
    const fullText = 'I want to learn React in 3 months';
    
    // Reset state
    setMessages([]);
    setTypingText('');
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
    setMessages([{ type: 'user', text: fullText }]);
    setTypingText('');
    
    await wait(800);
    if (!isMounted.current || !isActive) return;
    setIsAiTyping(true);
    
    await wait(2000);
    if (!isMounted.current || !isActive) return;
    setIsAiTyping(false);
    setMessages(prev => [...prev, { 
      type: 'ai', 
      text: 'Perfect! I\'ll create a personalized React learning roadmap for you.' 
    }]);

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
      setTypingText('');
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
    <div className="bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-sm rounded-2xl p-6 w-full border border-white/5 h-full flex flex-col">
      <div className="flex-1 space-y-4 mb-6 min-h-[180px] flex flex-col justify-center">
        {messages.map((message, index) => (
          <div key={index} className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in-0 slide-in-from-bottom-4 duration-500`}>
            <div className={`max-w-[85%] px-4 py-3 rounded-2xl text-sm transition-all duration-300 ${
              message.type === 'user' 
                ? 'bg-[#01BBFF] text-white shadow-lg shadow-[#01BBFF]/10' 
                : 'bg-slate-800/50 text-white border border-white/10'
            }`}>
              {message.text}
            </div>
          </div>
        ))}
        {isAiTyping && (
          <div className="flex justify-start animate-in fade-in-0 slide-in-from-bottom-4 duration-300">
            <div className="bg-slate-800/50 border border-white/10 px-4 py-3 rounded-2xl">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-[#01BBFF] rounded-full animate-bounce"></div>
                <div className="w-2 h-2 bg-[#01BBFF] rounded-full animate-bounce" style={{ animationDelay: '0.15s' }}></div>
                <div className="w-2 h-2 bg-[#01BBFF] rounded-full animate-bounce" style={{ animationDelay: '0.3s' }}></div>
              </div>
            </div>
          </div>
        )}
        {!messages.length && !isAiTyping && (
          <div className="flex items-center justify-center h-full text-gray-400 text-sm">
            Waiting for your goal...
          </div>
        )}
      </div>
      
      <div className="flex items-center gap-2 bg-slate-800/30 border border-white/10 rounded-xl p-3 transition-all duration-300">
        <div className="flex-1 bg-transparent text-white placeholder-gray-400 outline-none px-2 py-1 text-sm h-6">
          {typingText}
          {showCursor && <span className="w-px h-4 bg-[#01BBFF] inline-block animate-pulse ml-px"></span>}
        </div>
        <button 
          className="bg-[#01BBFF] hover:bg-[#01BBFF]/80 text-white p-2 rounded-lg transition-all duration-200 hover:scale-105 active:scale-95"
          aria-label="Send message"
        >
          <Send className="w-4 h-4" />
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
    { title: 'Learn JavaScript Basics', duration: '2 weeks' },
    { title: 'Understand React Fundamentals', duration: '3 weeks' },
    { title: 'Build First React App', duration: '2 weeks' },
    { title: 'Learn State Management', duration: '2 weeks' },
    { title: 'Create Portfolio Project', duration: '3 weeks' }
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
    <div className="bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-sm rounded-2xl p-6 w-full border border-white/5 h-full flex flex-col">
      <div className="flex items-center gap-2 mb-8 flex-shrink-0">
        <div className="w-8 h-8 bg-[#01BBFF] rounded-lg flex items-center justify-center">
          <Target className="w-4 h-4 text-white" />
        </div>
        <div>
          <h3 className="text-white font-semibold text-sm">Learn React in 3 Months</h3>
          <p className="text-gray-400 text-xs">Your personalized roadmap</p>
        </div>
      </div>
      
      <div className="w-full flex-1 flex flex-col justify-center overflow-hidden">
        <div className="w-full max-w-sm mx-auto">
          {roadmapSteps.map((step, index) => {
            const isCompleted = animationComplete || index < currentStep;
            const isCurrent = index === currentStep;
            const isRightSide = index % 2 === 0;

            // Class definitions for styling based on state
            const nodeClasses = isCompleted
              ? 'bg-green-400 border-green-400'
              : isCurrent
              ? 'bg-[#01BBFF] border-[#01BBFF] animate-pulse'
              : 'border-gray-600';
            
            const textClasses = isCompleted
              ? 'text-green-400 line-through decoration-green-400/50'
              : isCurrent
              ? 'text-[#01BBFF]'
              : 'text-white';
              
            const connectorClasses = isCompleted
              ? 'bg-green-400'
              : isCurrent
              ? 'bg-[#01BBFF]'
              : 'bg-gray-600';
              
            const verticalLineClasses = (isCompleted || (isCurrent && index > 0 && index < currentStep + 1)) ? 'bg-green-400' : 'bg-gray-600';

            return (
              <div key={index} className="grid grid-cols-[1fr_auto_1fr] items-center gap-x-4 h-24">
                {/* Left Branch */}
                <div className={`text-right ${isRightSide ? 'invisible' : ''}`}>
                  <div className="inline-block relative px-3 py-2 bg-black/20 border border-white/10 rounded-md shadow-lg">
                    <h4 className={`text-sm font-medium transition-colors duration-500 ${textClasses}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-400">{step.duration}</p>
                    <div className={`absolute left-full top-1/2 -translate-y-1/2 w-4 h-0.5 transition-colors duration-500 ${connectorClasses}`} />
                  </div>
                </div>

                {/* Center Spine & Node */}
                <div className="relative h-full flex items-center">
                  <div className={`absolute left-1/2 -translate-x-1/2 w-0.5 h-full transition-colors duration-500
                    ${index <= currentStep ? 'bg-green-400' : 'bg-gray-600'}
                    ${index === 0 ? 'top-1/2 h-1/2' : ''}
                    ${index === roadmapSteps.length - 1 ? 'bottom-1/2 h-1/2' : ''}
                  `} />
                  
                  <div className={`w-5 h-5 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all duration-500 z-10 ${nodeClasses}`}>
                    {isCompleted && <CheckCircle2 className="w-3 h-3 text-white" />}
                    {isCurrent && <div className="w-2 h-2 bg-white rounded-full" />}
                  </div>
                </div>

                {/* Right Branch */}
                <div className={`text-left ${!isRightSide ? 'invisible' : ''}`}>
                   <div className="inline-block relative px-3 py-2 bg-black/20 border border-white/10 rounded-md shadow-lg">
                    <h4 className={`text-sm font-medium transition-colors duration-500 ${textClasses}`}>
                      {step.title}
                    </h4>
                    <p className="text-xs text-gray-400">{step.duration}</p>
                    <div className={`absolute right-full top-1/2 -translate-y-1/2 w-4 h-0.5 transition-colors duration-500 ${connectorClasses}`} />
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
    <div className="bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-sm rounded-2xl p-6 w-full border border-white/5 h-full flex flex-col">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-white font-semibold text-sm">Progress Overview</h3>
        <div className="flex items-center gap-1 text-xs text-gray-400">
          <Clock className="w-3 h-3" />
          <span>Week 6 of 12</span>
        </div>
      </div>
      
      <div className="flex-1 space-y-5 flex flex-col justify-center">
        <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm text-white">Overall Progress</span>
            <span className="text-sm text-[#01BBFF] font-medium">{progress}%</span>
          </div>
          <div className="w-full bg-slate-700 rounded-full h-2">
            <div 
              className="bg-gradient-to-r from-[#01BBFF] to-cyan-400 h-2 rounded-full transition-all duration-200 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
        
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-800/30 border border-white/5 rounded-lg p-3 text-center">
            <div className="text-green-400 text-lg font-bold">2</div>
            <div className="text-xs text-gray-400">Completed</div>
          </div>
          <div className="bg-slate-800/30 border border-white/5 rounded-lg p-3 text-center">
            <div className="text-[#01BBFF] text-lg font-bold">1</div>
            <div className="text-xs text-gray-400">In Progress</div>
          </div>
          <div className="bg-slate-800/30 border border-white/5 rounded-lg p-3 text-center">
            <div className="text-gray-400 text-lg font-bold">8</div>
            <div className="text-xs text-gray-400">Total Tasks</div>
          </div>
        </div>
        
        <div className="flex items-center gap-2 bg-green-400/10 border border-green-400/20 rounded-lg p-3">
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="text-sm text-green-400">Milestone: React Fundamentals ✓</span>
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

const StepCard: React.FC<StepCardProps> = ({ step, index, isActive, onClick }) => (
  <div
    onClick={onClick}
    className={`relative cursor-pointer overflow-hidden rounded-xl border transition-all duration-300 backdrop-blur-sm p-7 ${
      isActive
        ? 'bg-gradient-to-br from-white/[0.02] to-transparent border-[#01BBFF]/50 shadow-xs shadow-[#01BBFF]/10'
        : 'bg-gradient-to-br from-white/[0.02] to-transparent border-white/5 hover:border-white/10'
    }`}
    role="button"
    tabIndex={0}
    onKeyDown={(e) => {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        onClick();
      }
    }}
    aria-label={`Step ${index + 1}: ${step.title}`}
  >
    <div className="flex items-start gap-5">
      <div className={`relative flex h-14 w-14 items-center justify-center rounded-xl transition-all duration-300 flex-shrink-0 ${
        isActive 
          ? 'bg-[#01BBFF] text-white' 
          : 'bg-slate-800/50 text-gray-400 border border-white/10'
      }`}>
        {step.icon}
        <div className="absolute -right-1 -bottom-1 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700 text-xs font-bold text-white ring-2 ring-slate-800/80">
          {index + 1}
        </div>
      </div>
      
      <div className="flex-1 pt-1">
        <h3 className="mb-2 text-lg font-semibold text-white">{step.title}</h3>
        <p className="text-sm text-gray-400 leading-relaxed">{step.description}</p>
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
    setActiveStep(prev => (prev + 1) % steps.length);
  }, [isAutoPlaying]);

  const handleStepClick = useCallback((index: number) => {
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
  }, [activeStep]);

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
      <div className="w-full h-full transition-all duration-500 ease-in-out">
        {currentDemo === 'chat' && <ChatDemo isActive={activeStep === 0} />}
        {currentDemo === 'roadmap' && <RoadmapDemo isActive={activeStep === 1} />}
        {currentDemo === 'tracking' && <TrackingDemo isActive={activeStep === 2} />}
      </div>
    );
  };

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(15,15,15,0.9),_rgba(9,9,11,1)),linear-gradient(to_bottom,_#0c0c0c,_#0a0a0a)] bg-fixed bg-no-repeat bg-cover overflow-hidden">

      {/* Background Effects */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,187,255,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <div className="relative z-10 container mx-auto py-12 sm:py-16 max-w-7xl">
        {/* Header */}
        <header className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#01BBFF]/20 to-[#01BBFF]/10 border border-[#01BBFF]/30 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-[#01BBFF] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[#01BBFF]">Goal Tracking</span>
          </div>
          
          {/* <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent mb-6 leading-tight">
            Ever Felt Stuck Setting&nbsp;
            <span className="bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent">
              Goals
            </span>
            ?
          </h1> */}

          <div className="relative mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent leading-tight relative z-10">
            Ever Felt Stuck Setting&nbsp;
              <span className="bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent">
              Goals ?
              </span>
            </h1>
            <h1 className="absolute inset-0 text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent blur-lg opacity-20 pointer-events-none select-none">
            Ever Felt Stuck Setting&nbsp;
            Goals ?
            </h1>
          </div>
          
          <p className="text-lg md:text-xl text-gray-400 max-w-3xl mx-auto leading-relaxed">
            Our intelligent platform transforms your ambitions into actionable, easy-to-follow roadmaps. Achieve more, with clarity and focus.
          </p>
        </header>

        {/* Main Content */}
        <main className="grid lg:grid-cols-2 gap-10 xl:gap-16 items-start">
          {/* Left Side: Demo Section */}
          <div className="order-2 lg:order-1">
            <div className="sticky top-8">
              <div className="bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-sm rounded-3xl border border-white/5 p-6 shadow-2xl shadow-black/20">
                <div className="h-[420px] flex items-center justify-center">
                  {renderDemo()}
                </div>
              </div>
            </div>
          </div>

          {/* Right Side: Steps Section */}
          <div className="order-1 lg:order-2 space-y-8">
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