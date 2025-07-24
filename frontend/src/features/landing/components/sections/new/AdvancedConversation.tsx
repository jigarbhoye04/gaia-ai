import React, { useState, useEffect, useRef } from 'react';
import { 
  Upload, 
  Image, 
  GitBranch, 
  Star, 
  Pin, 
  Search, 
  FileText, 
  MessageSquare, 
  CheckCircle,
  Sparkles,
  Clock,
  Database,
  Shield,
  CheckCheck
} from 'lucide-react';

interface FeatureCardProps {
  children: React.ReactNode;
  className?: string;
}

const FeatureCard: React.FC<{ children: React.ReactNode; className?: string }> = ({ children, className = "" }) => (
  <div className={`
    relative overflow-hidden rounded-2xl border border-white/10 
    bg-gradient-to-br from-white/5 to-white/[0.02] 
    backdrop-blur-sm shadow-lg
    transition-all duration-200 hover:shadow-xl hover:shadow-[#01BBFF]/5 hover:border-[#01BBFF]/20
    ${className}
  `}>
    {children}
  </div>
);

interface AnimationProps {
  isHovered: boolean;
}

const usePhysicsAnimation = (
  initialValue: number,
  targetValue: number,
  isActive: boolean,
  stiffness: number = 200,
  damping: number = 20,
  mass: number = 1
) => {
  const [value, setValue] = useState(initialValue);
  const [velocity, setVelocity] = useState(0);
  const animationRef = useRef<number | null>(null);

  useEffect(() => {
    if (!isActive) {
      setValue(initialValue);
      setVelocity(0);
      return;
    }

    const animate = () => {
      setValue(prevValue => {
        setVelocity(prevVelocity => {
          const force = -stiffness * (prevValue - targetValue);
          const damping_force = -damping * prevVelocity;
          const acceleration = (force + damping_force) / mass;
          const newVelocity = prevVelocity + acceleration * 0.016;
          return newVelocity;
        });
        
        const newValue = prevValue + velocity * 0.016;
        return newValue;
      });
      
      animationRef.current = requestAnimationFrame(animate);
    };

    animationRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [isActive, targetValue, stiffness, damping, mass, velocity]);

  return value;
};

const FileUploadAnimation: React.FC<AnimationProps> = ({ isHovered }) => {
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const animatedProgress = usePhysicsAnimation(0, uploadProgress, isHovered, 150, 25, 1);

  useEffect(() => {
    if (!isHovered) {
      setUploadProgress(0);
      setIsProcessing(false);
      setIsComplete(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      return;
    }

    const cycle = () => {
      setUploadProgress(0);
      setIsProcessing(false);
      setIsComplete(false);
      
      let progress = 0;
      intervalRef.current = setInterval(() => {
        progress += 1.5;
        setUploadProgress(progress);
        
        if (progress >= 100) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsProcessing(true);
          
          timeoutRef.current = setTimeout(() => {
            setIsProcessing(false);
            setIsComplete(true);
            
            timeoutRef.current = setTimeout(() => {
              if (isHovered) cycle();
            }, 1500);
          }, 1200);
        }
      }, 25);
    };

    cycle();
    
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
    };
  }, [isHovered]);

  return (
    <div className="flex flex-col justify-center space-y-4 p-2 w-full       ">
      <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-white/5 transition-all duration-500 hover:bg-slate-800/50">
        <div className="w-8 h-8 bg-slate-700 rounded flex items-center justify-center shrink-0">
          <FileText className="w-4 h-4 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-sm text-white mb-1">Document.pdf</div>
          <div className="w-full bg-slate-700 rounded-full h-1.5">
            <div 
              className="bg-[#01BBFF] h-1.5 rounded-full transition-all duration-75"
              style={{ width: `${Math.min(animatedProgress, 100)}%` }}
            />
          </div>
        </div>
        <div className="w-6 h-6 flex items-center justify-center shrink-0">
          {isComplete && (
            <CheckCircle className="w-5 h-5 text-green-400 animate-pulse" />
          )}
        </div>
      </div>
      
      <div className="min-h-[24px] flex items-center justify-center">
        {isProcessing && (
          <div className="flex items-center gap-2 text-sm text-[#01BBFF]">
            <Sparkles className="w-4 h-4 animate-pulse" />
            Processing...
          </div>
        )}
        
        {isComplete && (
          <div className="text-sm text-[#01BBFF] transition-all duration-300">
            ✓ Extracted 3 topics, 12 items
          </div>
        )}
      </div>
    </div>
  );
};

const ImageGenerationAnimation: React.FC<AnimationProps> = ({ isHovered }) => {
  const [step, setStep] = useState(0);
  const [dots, setDots] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const scaleValue = usePhysicsAnimation(0.8, step === 2 ? 1 : 0.95, isHovered, 180, 20, 1);

  useEffect(() => {
    if (!isHovered) {
      setStep(0);
      setDots(0);
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const cycle = () => {
      setStep(0);
      setDots(0);
      
      timeoutRef.current = setTimeout(() => {
        setStep(1);
        
        intervalRef.current = setInterval(() => {
          setDots(prev => (prev + 1) % 4);
        }, 200);
        
        timeoutRef.current = setTimeout(() => {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setStep(2);
          
          timeoutRef.current = setTimeout(() => {
            if (isHovered) cycle();
          }, 1500);
        }, 1200);
      }, 800);
    };

    cycle();
    
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered]);

  return (
    <div className="h-40 flex flex-col justify-center space-y-4 p-2 w-full  ">
      <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-white/5 transition-all duration-500 hover:bg-slate-800/50">
        <MessageSquare className="w-4 h-4 text-white shrink-0" />
        <div className="text-sm text-white">Create office workspace</div>
      </div>
      
      <div className="h-20 bg-slate-800/50 rounded-lg border border-white/5 flex items-center justify-center transition-all duration-300">
        {step === 0 && <div className="text-gray-500 text-sm">Ready to generate</div>}
        {step === 1 && (
          <div className="flex items-center gap-2">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className={`w-2 h-2 bg-[#01BBFF] rounded-full transition-all duration-200 ${
                  i <= dots ? 'opacity-100 scale-110' : 'opacity-30 scale-90'
                }`}
              />
            ))}
          </div>
        )}
        {step === 2 && (
          <div 
            className="w-full h-full bg-gradient-to-br from-[#01BBFF]/20 to-purple-500/20 rounded-lg flex items-center justify-center transition-all duration-500"
            
          >
            <Image className="w-full h-full text-[#01BBFF]" />
          </div>
        )}
      </div>
    </div>
  );
};

const FlowchartAnimation: React.FC<AnimationProps> = ({ isHovered }) => {
  const [activeStep, setActiveStep] = useState(0);
  const [connections, setConnections] = useState(new Set<number>());
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const steps = [
    { label: 'Login', icon: Shield },
    { label: 'Validate', icon: CheckCheck },
    { label: 'Database', icon: Database },
    { label: 'Dashboard', icon: GitBranch }
  ];
 
  useEffect(() => {
    if (!isHovered) {
      setActiveStep(0);
      setConnections(new Set());
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
      return;
    }
 
    const cycle = () => {
      setActiveStep(0);
      setConnections(new Set());
      
      const timings = [600, 1200, 1800, 2400, 3000, 3600];
      const actions = [
        () => setConnections(new Set([0])),
        () => setActiveStep(1),
        () => setConnections(new Set([0, 1])),
        () => setActiveStep(2),
        () => setConnections(new Set([0, 1, 2])),
        () => setActiveStep(3),
      ];
 
      timings.forEach((time, index) => {
        const timeout = setTimeout(actions[index], time);
        timeoutRefs.current.push(timeout);
      });
 
      const cycleTimeout = setTimeout(() => {
        if (isHovered) cycle();
      }, 4800);
      timeoutRefs.current.push(cycleTimeout);
    };
 
    cycle();
 
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
    };
  }, [isHovered]);
 
  return (
    <div className="h-40 flex flex-col justify-center space-y-4 p-2 w-full   ">
      <div className="text-sm text-white p-3 bg-slate-800/30 rounded-lg border border-white/5 transition-all duration-500 hover:bg-slate-800/50">
        "Create auth flow"
      </div>
      <div className="flex items-center justify-between px-2">
        {steps.map((step, index) => {
          const IconComponent = step.icon;
          const isActive = activeStep >= index;
          const showConnection = connections.has(index);
          return (
            <div key={index} className="flex items-center">
              <div className="flex flex-col items-center">
                <div
                  className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all duration-500 ${
                    isActive
                      ? 'border-[#01BBFF] bg-[#01BBFF]/20 scale-110'
                      : 'border-gray-600 bg-gray-800/50 scale-100'
                  }`}
                >
                  <IconComponent className={`w-3 h-3 transition-all duration-300 ${isActive ? 'text-[#01BBFF]' : 'text-gray-500'}`} />
                </div>
                <div className="text-xs text-gray-400 mt-1 text-center">{step.label}</div>
              </div>
              {index < steps.length - 1 && (
                <div className="w-6 h-0.5 mx-3 mb-3 bg-gray-700 relative">
                  <div
                    className={`absolute top-0 left-0 h-full bg-[#01BBFF] transition-all duration-700 ${
                      showConnection ? 'w-full' : 'w-0'
                    }`}
                  />
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
 };

const StarAnimation: React.FC<AnimationProps> = ({ isHovered }) => {
  const [starredItems, setStarredItems] = useState(new Set<number>());
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const messages = [
    "Project roadmap discussion",
    "Budget approval meeting", 
    "Team performance review"
  ];

  useEffect(() => {
    if (!isHovered) {
      setStarredItems(new Set());
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
      return;
    }

    const cycle = () => {
      setStarredItems(new Set());
      
      const timeouts = [
        setTimeout(() => setStarredItems(new Set([0])), 600),
        setTimeout(() => setStarredItems(new Set([0, 1])), 1200),
        setTimeout(() => setStarredItems(new Set([0, 1, 2])), 1800),
        setTimeout(() => {
          if (isHovered) cycle();
        }, 3200)
      ];
      
      timeoutRefs.current = timeouts;
    };

    cycle();
    
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [isHovered]);

  return (
    <div className="h-40 flex flex-col justify-center p-2 w-full    ">
      <div className="space-y-2">
        {messages.map((message, index) => (
          <div 
            key={index}
            className={`flex items-center gap-3 p-2 rounded-lg transition-all duration-500 ${
              starredItems.has(index)
                ? 'bg-[#01BBFF]/10 border border-[#01BBFF]/20 scale-105' 
                : 'bg-slate-800/30 border border-white/5 scale-100'
            }`}
          >
            <Star 
              className={`w-4 h-4 shrink-0 transition-all duration-400 ${
                starredItems.has(index) 
                  ? 'text-[#01BBFF] fill-current scale-110' 
                  : 'text-gray-500 scale-100'
              }`} 
            />
            <div className="text-sm text-white truncate">{message}</div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PinAnimation: React.FC<AnimationProps> = ({ isHovered }) => {
  const [pinnedMessage, setPinnedMessage] = useState<string | null>(null);
  const [showPinButton, setShowPinButton] = useState(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);

  const messages = [
    "Team standup notes",
    "Client feedback", 
    "Action items"
  ];

  useEffect(() => {
    if (!isHovered) {
      setPinnedMessage(null);
      setShowPinButton(false);
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
      return;
    }

    const cycle = () => {
      setPinnedMessage(null);
      setShowPinButton(false);
      
      const timeouts = [
        setTimeout(() => {
          setShowPinButton(true);
          const timeout2 = setTimeout(() => {
            setPinnedMessage("Deploy at 3 PM");
            setShowPinButton(false);
          }, 800);
          timeoutRefs.current.push(timeout2);
        }, 800),
        setTimeout(() => {
          if (isHovered) cycle();
        }, 3200)
      ];
      
      timeoutRefs.current = timeouts;
    };

    cycle();
    
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
    };
  }, [isHovered]);

  return (
    <div className="h-50 flex flex-col justify-center p-2 w-full     ">
      <div className="space-y-2">
        {pinnedMessage && (
          <div className="p-2 bg-[#01BBFF]/10 border border-[#01BBFF]/20 rounded-lg transition-all duration-500 scale-105">
            <div className="flex items-center gap-2 mb-1">
              <Pin className="w-4 h-4 text-[#01BBFF] shrink-0" />
              <div className="text-sm text-[#01BBFF] font-medium">Pinned</div>
            </div>
            <div className="text-sm text-white">{pinnedMessage}</div>
          </div>
        )}
        
        {messages.map((message, index) => (
          <div 
            key={index}
            className="flex items-center gap-3 p-2 bg-slate-800/30 rounded-lg border border-white/5 transition-all duration-300 hover:bg-slate-800/50"
          >
            <MessageSquare className="w-4 h-4 text-gray-400 shrink-0" />
            <div className="text-sm text-white flex-1 truncate">{message}</div>
            {showPinButton && index === 2 && (
              <Pin className="w-4 h-4 text-[#01BBFF] cursor-pointer animate-pulse shrink-0" />
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

const SearchAnimation: React.FC<AnimationProps> = ({ isHovered }) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Array<{ title: string; time: string }>>([]);
  const [isSearching, setIsSearching] = useState(false);
  const timeoutRefs = useRef<NodeJS.Timeout[]>([]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (!isHovered) {
      setSearchTerm("");
      setResults([]);
      setIsSearching(false);
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      timeoutRefs.current = [];
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }

    const cycle = () => {
      setSearchTerm("");
      setResults([]);
      setIsSearching(false);
      
      const term = "budget meeting";
      let index = 0;
      
      intervalRef.current = setInterval(() => {
        if (index < term.length) {
          setSearchTerm(term.slice(0, index + 1));
          index++;
        } else {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setIsSearching(true);
          
          const timeout = setTimeout(() => {
            setIsSearching(false);
            setResults([
              { title: "Q4 Budget Meeting", time: "2 days ago" },
              { title: "Budget Approval", time: "1 week ago" }
            ]);
          }, 800);
          timeoutRefs.current.push(timeout);
        }
      }, 80);
      
      const cycleTimeout = setTimeout(() => {
        if (isHovered) cycle();
      }, 4000);
      timeoutRefs.current.push(cycleTimeout);
    };

    cycle();
    
    return () => {
      timeoutRefs.current.forEach(timeout => clearTimeout(timeout));
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [isHovered]);

  return (
    <div className=" flex flex-col justify-center space-y-3 p-2 w-full      ">
      <div className="flex items-center gap-3 p-3 bg-slate-800/30 rounded-lg border border-white/5 transition-all duration-500 hover:bg-slate-800/50">
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <div className="text-sm text-white">
          {searchTerm}
          {isHovered && <span className="animate-pulse text-[#01BBFF]">|</span>}
        </div>
      </div>
      
      <div className="flex-1 min-h-0">
        {isSearching && (
          <div className="flex items-center gap-2 text-sm text-[#01BBFF]">
            <div className="w-4 h-4 border-2 border-[#01BBFF] border-t-transparent rounded-full animate-spin shrink-0" />
            Searching...
          </div>
        )}
        
        {results.length > 0 && (
          <div className="space-y-2">
            {results.map((result, index) => (
              <div 
                key={index}
                className="p-2 bg-[#01BBFF]/10 border border-[#01BBFF]/20 rounded-lg transition-all duration-300 hover:scale-105"
              >
                <div className="text-sm text-white mb-1">{result.title}</div>
                <div className="text-xs text-gray-400 flex items-center gap-1">
                  <Clock className="w-3 h-3 shrink-0" />
                  {result.time}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const featureCards = [
  {
    title: "Upload & Understand Files",
    description: "Drop in PDFs, docs, or images—GAIA reads and extracts the key insights instantly.",
    icon: <Upload className="w-5 h-5" />,
    component: FileUploadAnimation
  },
  {
    title: "Generate Images from Ideas", 
    description: "Turn natural language into visual concepts without leaving the conversation.",
    icon: <Image className="w-5 h-5" />,
    component: ImageGenerationAnimation
  },
  {
    title: "Create Flowcharts Instantly",
    description: "Describe any logic or process—GAIA transforms it into clean, structured diagrams.",
    icon: <GitBranch className="w-5 h-5" />,
    component: FlowchartAnimation
  },
  {
    title: "Star Important Threads",
    description: "Save critical conversations and reference them easily anytime.",
    icon: <Star className="w-5 h-5" />,
    component: StarAnimation
  },
  {
    title: "Pin Key Messages",
    description: "Keep your most relevant messages front and center—never lose track again.",
    icon: <Pin className="w-5 h-5" />,
    component: PinAnimation
  },
  {
    title: "Search Across Conversations",
    description: "Quickly find past messages, files, or threads with intelligent memory search.",
    icon: <Search className="w-5 h-5" />,
    component: SearchAnimation
  }
];

export default function AdvancedConversation() {
  const [hoveredCard, setHoveredCard] = useState<number | null>(null);

  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top_left,_rgba(15,15,15,0.9),_rgba(9,9,11,1)),linear-gradient(to_bottom,_#0c0c0c,_#0a0a0a)] bg-fixed bg-no-repeat bg-cover overflow-hidden">

      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,187,255,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <div className="relative z-10 container mx-auto py-16 max-w-7xl">
        <div className="text-center mb-16">
          

          <div className="relative mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent leading-tight relative z-10">
            Smarter&nbsp;
              <span className="bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent">
              Conversations
              </span>
            </h1>
            <h1 className="absolute inset-0 text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent blur-lg opacity-20 pointer-events-none select-none">
            Smarter&nbsp;
            Conversations
            </h1>
          </div>
          
          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Finally, AI that feels like it's made for you.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
          {featureCards.map((card, index) => {
            const AnimationComponent = card.component;
            return (
              <FeatureCard 
                key={index} 
                className="transition-all duration-300 h-80 min-h-[200px]"
              >
                <div 
                  className="p-4 h-full flex flex-col min-h-[400px]"
                  onMouseEnter={() => setHoveredCard(index)}
                  onMouseLeave={() => setHoveredCard(null)}
                >
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-[#01BBFF] p-2 bg-[#01BBFF]/10 rounded-lg transition-all duration-300 hover:bg-[#01BBFF]/20 shrink-0">
                      {card.icon}
                    </div>
                    <h3 className="text-lg font-semibold text-white">{card.title}</h3>
                  </div>
                  
                  <p className="text-sm text-gray-400 mb-2 leading-relaxed">
                    {card.description}
                  </p>
                  
                  <div className="flex-1 flex items-start w-full">
                    <AnimationComponent isHovered={hoveredCard === index} />
                  </div>
                </div>
              </FeatureCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}