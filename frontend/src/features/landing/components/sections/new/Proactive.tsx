import React, {
  useState,
  useEffect,
  useLayoutEffect,
  useRef,
  useCallback,
  ElementType,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useInView } from "react-intersection-observer";
import {
  Check,
  Clock,
  GitBranch,
  Search,
  BookOpen,
  Users,
  Target,
  Zap,
  Star,
  Archive,
  Reply,
  Presentation,
  ArrowRight,
  Undo2,
  Redo2,
  Printer,
  Paintbrush2,
  ZoomIn,
  MousePointer2,
  Type,
  Image as ImageIcon,
  Shapes,
  PenLine,
  MessageSquarePlus,
  LayoutPanelLeft,
  Palette,
  Film,
  PlusSquare,
  ChevronDown,
} from "lucide-react";
import { demoContents, DemoData } from "./demo-data"; // Adjust the import path if needed

// --- Helper & Header Components ---
const wait = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const LargeHeader: React.FC<{
  headingText: string;
  subHeadingText: string;
}> = ({ headingText, subHeadingText }) => (
  <header className="text-center">
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut" }}
      className="mb-6 inline-flex items-center gap-2 rounded-full border border-[#01BBFF]/30 bg-gradient-to-r from-[#01BBFF]/20 to-[#01BBFF]/10 px-4 py-2 backdrop-blur-sm"
    >
      <div className="h-2 w-2 animate-pulse rounded-full bg-[#01BBFF]" />
      <span className="text-sm font-medium text-[#01BBFF]">
        Proactive Intelligence
      </span>
    </motion.div>
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      className="mb-6 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-4xl leading-tight font-bold text-transparent md:text-5xl lg:text-6xl"
    >
      {headingText}
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
      className="mx-auto max-w-4xl text-lg leading-relaxed text-gray-400 md:text-xl"
    >
      {subHeadingText}
    </motion.p>
  </header>
);

const GoogleLogo: React.FC<{
  src: string;
  alt: string;
  className?: string;
}> = ({ src, alt, className }) => (
  <motion.img
    src={src}
    alt={alt}
    className={`object-contain ${className}`}
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
  />
);

// --- UI Components for different stages ---

const GmailView: React.FC<{
  isExpanded: boolean;
  highlightTrigger: boolean;
  content: DemoData["email"];
}> = ({ isExpanded, highlightTrigger, content }) => {
  const containerVariants = {
    collapsed: { height: "80px" },
    expanded: { height: "450px" },
  };

  return (
    <motion.div
      layoutId="main-container"
      variants={containerVariants}
      initial="collapsed"
      animate={isExpanded ? "expanded" : "collapsed"}
      transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
      className="w-full max-w-3xl overflow-hidden rounded-2xl bg-[#F2F6FC] shadow-2xl"
    >
      <div className="flex h-full flex-col p-4">
        <motion.div
          layout="position"
          className="flex flex-shrink-0 items-center gap-4"
        >
          <GoogleLogo
            src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg"
            alt="Gmail"
            className="h-8 w-8"
          />
          <div className="min-w-0 flex-1">
            <h3 className="truncate text-base font-semibold text-gray-800">
              {content.subject}
            </h3>
            <p className="truncate text-sm text-gray-600">
              {content.sender} &lt;{content.senderEmail}&gt;
            </p>
          </div>
          <div className="flex flex-shrink-0 items-center gap-4 text-gray-500">
            <Star className="h-5 w-5 transition-colors hover:text-yellow-500" />
            <Archive className="h-5 w-5 transition-colors hover:text-gray-800" />
            <Reply className="h-5 w-5 transition-colors hover:text-gray-800" />
          </div>
        </motion.div>

        <AnimatePresence>
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{
                opacity: 1,
                y: 0,
                transition: { delay: 0.4, duration: 0.5 },
              }}
              exit={{ opacity: 0 }}
              className="mt-4 flex-grow space-y-4 overflow-auto border-t border-gray-200 pt-4"
            >
              <p className="text-sm leading-relaxed text-gray-700">
                {content.body(highlightTrigger)}
              </p>
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{
                  opacity: 1,
                  y: 0,
                  transition: { delay: 2.0, duration: 0.5 },
                }}
                className="flex items-center gap-3 rounded-xl border border-[#01BBFF]/20 bg-[#01BBFF]/5 p-4 text-sm text-[#01BBFF]"
              >
                <Zap className="h-5 w-5 flex-shrink-0 text-[#01BBFF]" />
                <span className="font-medium">
                  GAIA is creating your action plan...
                </span>
                <div className="ml-auto flex space-x-1">
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#01BBFF]"
                    style={{ animationDelay: "0s" }}
                  ></div>
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#01BBFF]"
                    style={{ animationDelay: "0.1s" }}
                  ></div>
                  <div
                    className="h-1.5 w-1.5 animate-bounce rounded-full bg-[#01BBFF]"
                    style={{ animationDelay: "0.2s" }}
                  ></div>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

const CalendarView: React.FC<{
  content: DemoData["calendar"];
  emailContent: DemoData["email"];
}> = ({ content, emailContent }) => (
  <motion.div
    layoutId="main-container"
    className="flex h-[600px] w-full max-w-5xl flex-col overflow-hidden rounded-2xl bg-white shadow-2xl md:h-[550px] md:flex-row"
  >
    <div className="flex w-full flex-col border-b border-gray-200 bg-white p-4 md:w-64 md:border-r md:border-b-0">
      <div className="mb-6 flex items-center gap-2 p-2">
        <GoogleLogo
          src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/640px-Google_Calendar_icon_%282020%29.svg.png"
          alt="Google Calendar"
          className="h-8 w-8"
        />
        <span className="text-xl font-semibold text-gray-700">Calendar</span>
      </div>
      <div className="text-center">
        <div className="mb-2 font-semibold text-gray-800">
          {content.month} {content.year}
        </div>
        <div className="mb-2 grid grid-cols-7 gap-1 text-xs text-gray-500">
          {["S", "M", "T", "W", "T", "F", "S"].map((d) => (
            <div key={d}>{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-1 text-sm">
          {/* Simplified calendar view for demo purposes */}
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={`empty-${i}`} />
          ))}
          {Array.from({ length: 31 }, (_, i) => (
            <div
              key={i}
              className={`flex aspect-square cursor-pointer items-center justify-center rounded-full p-1 ${i + 1 === content.dueDay ? "bg-blue-600 font-bold text-white" : "text-gray-700 hover:bg-gray-100"}`}
            >
              {i + 1}
            </div>
          ))}
        </div>
      </div>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1, transition: { delay: 1.5 } }}
        className="mt-auto flex items-center gap-2 rounded-lg bg-blue-100 p-2 text-sm text-blue-700"
      >
        <Check className="h-4 w-4" />
        <span>Deadline added to calendar</span>
      </motion.div>
    </div>
    <div className="flex-1 bg-white p-6">
      <div className="mb-4 flex items-baseline justify-between">
        <h2 className="text-xl font-normal text-gray-700 md:text-2xl">
          <span className="font-bold text-blue-600">{content.dayOfWeek},</span>{" "}
          {content.month} {content.dueDay}
        </h2>
        <div className="text-sm text-gray-500">Day</div>
      </div>
      <div className="relative h-full">
        <div className="absolute inset-0 grid grid-cols-1 grid-rows-12">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="border-t border-gray-200" />
          ))}
        </div>
        <motion.div
          initial={{ opacity: 0, y: 30, scale: 0.9 }}
          animate={{
            opacity: 1,
            y: 0,
            scale: 1,
            transition: { delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] },
          }}
          className="absolute top-[60.33%] right-4 left-4 flex h-20 items-start gap-4 rounded-lg border-l-4 border-blue-500 bg-blue-100 p-3 shadow-lg"
        >
          <div className="flex-1">
            <h3 className="text-sm font-semibold text-blue-900">
              {emailContent.subject}
            </h3>
            <p className="text-xs text-blue-800">{emailContent.topic}</p>
          </div>
          <div className="flex items-center gap-2 text-xs text-blue-800">
            <Clock className="h-3 w-3" />
            <span>11:59 PM</span>
          </div>
        </motion.div>
      </div>
    </div>
  </motion.div>
);

const SlidesView: React.FC<{
  content: DemoData["slides"];
  emailContent: DemoData["email"];
  onComplete: () => void;
}> = ({ content, emailContent, onComplete }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
    if (currentSlideIndex >= content.length - 1) {
      const finalTimer = setTimeout(onComplete, 2500);
      return () => clearTimeout(finalTimer);
    }

    const timer = setTimeout(() => {
      setCurrentSlideIndex((prev) => prev + 1);
    }, 2500);

    return () => clearTimeout(timer);
  }, [currentSlideIndex, content.length, onComplete]);

  const currentSlide = content[currentSlideIndex];

  type ToolbarIconProps = {
    icon: ElementType;
    active?: boolean;
    hasDropdown?: boolean;
  };

  const ToolbarIcon: React.FC<ToolbarIconProps> = ({
    icon: Icon,
    active = false,
    hasDropdown = false,
  }) => (
    <button
      className={`rounded p-1.5 hover:bg-gray-200 ${active ? "bg-blue-100 text-blue-600" : "text-gray-600"}`}
    >
      <div className="flex items-center">
        <Icon className="h-5 w-5" />
        {hasDropdown && <ChevronDown className="ml-0.5 h-3 w-3" />}
      </div>
    </button>
  );

  return (
    <motion.div
      layoutId="main-container"
      className="flex h-[600px] w-full max-w-7xl flex-col overflow-hidden rounded-2xl bg-[#F8F9FA] shadow-2xl"
    >
      {/* Top Menu Bar */}
      <div className="border-b border-gray-300 bg-white px-2 py-1 text-sm text-gray-800">
        <div className="flex items-center gap-3">
          <GoogleLogo
            src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Google_Slides_2020_Logo.svg/640px-Google_Slides_2020_Logo.svg.png"
            alt="Google Slides"
            className="h-8 w-8 flex-shrink-0"
          />
          <div className="flex min-w-0 flex-grow flex-col">
            <span className="truncate font-medium">{emailContent.topic}</span>
            <div className="mt-1 flex items-center gap-4 text-xs text-gray-600">
              <Star className="h-4 w-4 cursor-pointer text-gray-500 hover:text-yellow-500" />
              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100">
                File
              </span>
              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100">
                Edit
              </span>
              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100">
                View
              </span>
              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100">
                Insert
              </span>
              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100">
                Format
              </span>
              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100">
                Slide
              </span>
              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100">
                Arrange
              </span>
              <span className="cursor-pointer rounded px-1 py-0.5 hover:bg-gray-100">
                Tools
              </span>
            </div>
          </div>
          <div className="ml-auto flex flex-shrink-0 items-center gap-3">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1, transition: { delay: 1 } }}
              className="hidden items-center gap-2 rounded-full bg-green-100 px-3 py-1 md:flex"
            >
              <Zap className="h-4 w-4 text-green-700" />
              <span className="text-xs font-medium text-green-800">
                Draft by GAIA
              </span>
            </motion.div>
            <button className="hidden items-center gap-1.5 rounded bg-gray-100 px-4 py-2 text-sm font-medium text-gray-800 hover:bg-gray-200 sm:flex">
              <Presentation className="h-5 w-5" />
              Slideshow
            </button>
            <button className="rounded-md bg-[#1A73E8] px-5 py-2 text-sm font-semibold text-white">
              Share
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="flex flex-shrink-0 flex-wrap items-center gap-1 border-b border-gray-200 bg-white px-3 py-1">
        <ToolbarIcon icon={PlusSquare} hasDropdown />
        <div className="mx-1 h-6 w-px bg-gray-300"></div>
        <ToolbarIcon icon={Undo2} />
        <ToolbarIcon icon={Redo2} />
        <ToolbarIcon icon={Printer} />
        <ToolbarIcon icon={Paintbrush2} />
        <ToolbarIcon icon={ZoomIn} hasDropdown />
        <div className="mx-1 h-6 w-px bg-gray-300"></div>
        <ToolbarIcon icon={MousePointer2} active />
        <ToolbarIcon icon={Type} />
        <ToolbarIcon icon={ImageIcon} />
        <ToolbarIcon icon={Shapes} hasDropdown />
        <ToolbarIcon icon={PenLine} hasDropdown />
        <div className="mx-1 h-6 w-px bg-gray-300"></div>
        <div className="flex items-center gap-1">
          <button className="rounded px-2 py-1 text-sm hover:bg-gray-100">
            Background
          </button>
          <button className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-gray-100">
            Layout <ChevronDown className="h-4 w-4" />
          </button>
          <button className="flex items-center gap-1 rounded px-2 py-1 text-sm hover:bg-gray-100">
            Theme <ChevronDown className="h-4 w-4" />
          </button>
          <button className="rounded px-2 py-1 text-sm hover:bg-gray-100">
            Transition
          </button>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden bg-[#E9EEF6]">
        {/* Left Slide Panel */}
        <div className="w-48 space-y-3 overflow-y-auto border-r border-gray-200 bg-white p-3">
          {content.map((slide, i) => (
            <div
              key={i}
              className="group relative cursor-pointer rounded-sm p-1"
            >
              <span className="absolute top-1 left-2 z-10 text-xs text-gray-500">
                {i + 1}
              </span>
              {i === currentSlideIndex && (
                <motion.div
                  layoutId="active-slide-indicator"
                  className="absolute inset-0 rounded-sm border-2 border-blue-500"
                  transition={{ type: "spring", stiffness: 300, damping: 30 }}
                />
              )}
              <div
                className={`relative flex aspect-video items-center justify-center rounded-sm border border-gray-400 bg-white p-1 ${i !== currentSlideIndex ? "group-hover:border-gray-500" : ""}`}
              >
                <p className="px-1 text-center text-[9px] font-semibold text-gray-600">
                  {slide.title}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-1 flex-col">
          <div className="flex flex-1 overflow-hidden">
            <div className="flex flex-1 items-center justify-center p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentSlideIndex}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{
                    opacity: 1,
                    scale: 1,
                    transition: { duration: 0.5, ease: "easeOut" },
                  }}
                  exit={{
                    opacity: 0,
                    scale: 0.95,
                    transition: { duration: 0.3, ease: "easeIn" },
                  }}
                  className={`flex h-full w-full flex-col justify-between rounded-sm border border-gray-300 p-8 text-left shadow-lg ${currentSlide.bgColor} ${currentSlide.textColor}`}
                >
                  <div>
                    <h1
                      className={`mb-4 text-4xl font-bold ${currentSlide.highlightColor}`}
                    >
                      {currentSlide.title}
                    </h1>
                    {currentSlide.subtitle && (
                      <p className="text-xl opacity-80">
                        {currentSlide.subtitle}
                      </p>
                    )}
                    {currentSlide.points && (
                      <ul className="mt-6 space-y-3 text-base">
                        {currentSlide.points.map((point, i) => (
                          <motion.li
                            key={i}
                            className="flex items-start gap-3"
                            initial={{ opacity: 0, x: -20 }}
                            animate={{
                              opacity: 1,
                              x: 0,
                              transition: { delay: 0.3 + i * 0.2 },
                            }}
                          >
                            <ArrowRight
                              className={`mt-1 h-5 w-5 flex-shrink-0 ${currentSlide.highlightColor}`}
                            />
                            <span>{point}</span>
                          </motion.li>
                        ))}
                      </ul>
                    )}
                  </div>
                  {currentSlide.image && (
                    <motion.div
                      className="my-4 flex justify-center"
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={{
                        opacity: 1,
                        scale: 1,
                        transition: { delay: 0.5 },
                      }}
                    >
                      <img
                        src={currentSlide.image}
                        alt={currentSlide.title}
                        className="max-h-40 rounded-lg bg-white/10 object-contain p-2"
                      />
                    </motion.div>
                  )}
                  <div className="mt-auto text-right text-xs opacity-60">
                    Slide {currentSlideIndex + 1} of {content.length}
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </div>
      {currentSlideIndex === content.length - 1 && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1, transition: { delay: 1 } }}
          className="absolute bottom-4 left-1/2 flex -translate-x-1/2 items-center gap-2 rounded-lg bg-green-100 p-2 text-sm text-green-700 shadow-md"
        >
          <Check className="h-4 w-4" />
          <span>Presentation draft complete</span>
        </motion.div>
      )}
    </motion.div>
  );
};

// --- REVAMPED ROADMAP COMPONENT ---

const useWindowSize = () => {
  const [size, setSize] = useState([0, 0]);
  useLayoutEffect(() => {
    function updateSize() {
      setSize([window.innerWidth, window.innerHeight]);
    }
    window.addEventListener("resize", updateSize);
    updateSize();
    return () => window.removeEventListener("resize", updateSize);
  }, []);
  return size;
};

const AnimatedPath: React.FC<{ d: string; isActive: boolean }> = ({
  d,
  isActive,
}) => (
  <motion.path
    d={d}
    fill="none"
    strokeWidth="2.5"
    strokeLinecap="round"
    initial={{ pathLength: 0, opacity: 0 }}
    animate={{
      pathLength: isActive ? 1 : 0,
      opacity: isActive ? 1 : 0,
    }}
    transition={{
      pathLength: {
        delay: 0.2,
        type: "tween",
        duration: 0.8,
        ease: "easeInOut",
      },
      opacity: { delay: 0.2, duration: 0.01 },
    }}
    style={{ stroke: "url(#line-gradient)" }}
  />
);

const RoadmapView: React.FC<{
  currentStep: number;
  content: DemoData["roadmap"];
  emailContent: DemoData["email"];
}> = ({ currentStep, content, emailContent }) => {
  const nodeRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  const [paths, setPaths] = useState<string[]>([]);
  useWindowSize(); // Hook to trigger re-render on resize

  useLayoutEffect(() => {
    const newPaths: string[] = [];
    if (!containerRef.current) return;

    const containerRect = containerRef.current.getBoundingClientRect();
    let allNodesRendered = true;
    for (let i = 0; i < content.length; i++) {
      if (!nodeRefs.current[i]) {
        allNodesRendered = false;
        break;
      }
    }

    if (!allNodesRendered) return;

    for (let i = 0; i < content.length - 1; i++) {
      const startNode = nodeRefs.current[i];
      const endNode = nodeRefs.current[i + 1];

      if (startNode && endNode) {
        const startRect = startNode.getBoundingClientRect();
        const endRect = endNode.getBoundingClientRect();

        const startX =
          startRect.left + startRect.width / 2 - containerRect.left;
        const startY = startRect.top + startRect.height / 2 - containerRect.top;
        const endX = endRect.left + endRect.width / 2 - containerRect.left;
        const endY = endRect.top + endRect.height / 2 - containerRect.top;

        const curveStrength = Math.max(60, (endX - startX) * 0.3);

        const d = `M ${startX},${startY} C ${startX + curveStrength},${startY} ${endX - curveStrength},${endY} ${endX},${endY}`;
        newPaths.push(d);
      }
    }
    setPaths(newPaths);
  }, [content, currentStep]); // Re-calculate when data or step changes to ensure accuracy

  return (
    <motion.div
      layoutId="main-container"
      className="flex h-auto min-h-[550px] w-full max-w-6xl flex-col justify-center overflow-hidden rounded-2xl bg-gray-50 p-8 shadow-2xl md:p-12"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { delay: 0.2, duration: 0.5 },
        }}
        className="w-full"
      >
        <div className="mb-20 flex items-center justify-between md:mb-16">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-lg bg-blue-100">
              <Target className="h-6 w-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">
                {emailContent.topic}
              </h2>
              <p className="text-gray-500">AI-Generated Project Plan</p>
            </div>
          </div>
          <AnimatePresence>
            {currentStep >= content.length && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="hidden items-center gap-2 rounded-full bg-green-100 px-4 py-2 text-sm md:flex"
              >
                <Check className="h-5 w-5 text-green-700" />
                <span className="font-medium text-green-800">
                  Project Finalized
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div ref={containerRef} className="relative h-48 w-full">
        <svg className="absolute inset-0 z-0 h-full w-full" aria-hidden="true">
          <defs>
            <linearGradient
              id="line-gradient"
              x1="0%"
              y1="0%"
              x2="100%"
              y2="0%"
            >
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <g>
            {paths.map((path, index) => (
              <AnimatedPath
                key={index}
                d={path}
                isActive={currentStep > index}
              />
            ))}
          </g>
        </svg>

        <div className="relative z-10 flex h-full items-center justify-between">
          {content.map((step, index) => {
            const isCompleted = currentStep > index;
            const isCurrent = currentStep === index;

            return (
              <div
                key={index}
                ref={(el) => {
                  nodeRefs.current[index] = el;
                }}
                className="flex flex-col items-center gap-3 text-center"
                style={{
                  // Staggered layout for a more organic feel
                  transform: `translateY(${index % 2 === 0 ? "-40px" : "40px"})`,
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{
                    delay: 0.4 + index * 0.1,
                    type: "spring",
                    stiffness: 250,
                    damping: 20,
                  }}
                >
                  <motion.div
                    animate={{ scale: isCurrent ? 1.15 : 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 15 }}
                    className={`relative flex h-14 w-14 items-center justify-center rounded-full shadow-lg transition-all duration-300 ${
                      isCompleted
                        ? "bg-blue-500"
                        : isCurrent
                          ? "bg-blue-600 ring-4 ring-white/80"
                          : "border-2 border-gray-300 bg-white"
                    }`}
                  >
                    <step.icon
                      className={`h-7 w-7 transition-colors duration-300 ${
                        isCompleted || isCurrent
                          ? "text-white"
                          : "text-gray-400"
                      }`}
                    />
                    {isCurrent && (
                      <div className="absolute inset-[-6px] animate-ping rounded-full border-2 border-blue-400" />
                    )}
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                  className="w-28"
                >
                  <h4
                    className={`text-sm font-semibold transition-colors duration-300 ${
                      isCurrent
                        ? "text-blue-600"
                        : isCompleted
                          ? "text-gray-900"
                          : "text-gray-500"
                    }`}
                  >
                    {step.label}
                  </h4>
                  <p className="text-xs text-gray-400">{step.time}</p>
                </motion.div>
              </div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
};

// --- Main App Component (MODIFIED) ---
const ProactiveDemo: React.FC = () => {
  const { ref, inView } = useInView({
    triggerOnce: true, // Animation triggers only once
    threshold: 0.4, // Trigger when 40% of the component is visible
  });

  const [stage, setStage] = useState("gmail");
  const [isExpanded, setIsExpanded] = useState(false);
  const [highlightTrigger, setHighlightTrigger] = useState(false);
  const [roadmapStep, setRoadmapStep] = useState(-1);
  const [contentIndex, setContentIndex] = useState(0);
  const isMounted = useRef(true);

  const currentContent = demoContents[contentIndex];
  const totalRoadmapSteps = currentContent.roadmap.length;

  const animationSequence = useCallback(async () => {
    if (!isMounted.current) return;

    setStage("gmail");
    setIsExpanded(false);
    setHighlightTrigger(false);
    setRoadmapStep(-1);
    await wait(2500);

    if (!isMounted.current) return;
    setIsExpanded(true);
    await wait(1500);

    if (!isMounted.current) return;
    setHighlightTrigger(true);
    await wait(3000);

    if (!isMounted.current) return;
    setStage("calendar");
    await wait(4000);

    if (!isMounted.current) return;
    setStage("slides");
  }, [contentIndex]);

  const handleSlidesComplete = useCallback(async () => {
    if (!isMounted.current) return;
    setStage("roadmap");
    await wait(1000);

    for (let i = 0; i <= totalRoadmapSteps; i++) {
      if (!isMounted.current) return;
      setRoadmapStep(i);
      await wait(1000);
    }

    await wait(4000);

    if (isMounted.current) {
      setContentIndex((prev) => (prev + 1) % demoContents.length);
      const timer = setTimeout(animationSequence, 1000);
      return () => clearTimeout(timer);
    }
  }, [totalRoadmapSteps, animationSequence, demoContents.length]);

  useEffect(() => {
    isMounted.current = true;
    let timer: NodeJS.Timeout | undefined;

    if (inView) {
      // Component is in view, start the animation after a short delay
      timer = setTimeout(animationSequence, 1000);
    }

    return () => {
      isMounted.current = false;
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [inView, animationSequence]); // Depend on inView to trigger the effect

  return (
    <div
      ref={ref}
      className="relative flex aspect-video w-full max-w-7xl items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-white/[0.02] to-transparent shadow-2xl shadow-black/40 backdrop-blur-2xl md:aspect-[16/9] md:p-8 lg:aspect-auto lg:h-[665px]"
    >
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(1,187,255,0.1),transparent_50%)]" />
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(6,182,212,0.1),transparent_50%)]" />

      <AnimatePresence mode="wait">
        {stage === "gmail" && (
          <GmailView
            key="gmail"
            isExpanded={isExpanded}
            highlightTrigger={highlightTrigger}
            content={currentContent.email}
          />
        )}
        {stage === "calendar" && (
          <CalendarView
            key="calendar"
            content={currentContent.calendar}
            emailContent={currentContent.email}
          />
        )}
        {stage === "slides" && (
          <SlidesView
            key="slides"
            content={currentContent.slides}
            emailContent={currentContent.email}
            onComplete={handleSlidesComplete}
          />
        )}
        {stage === "roadmap" && (
          <RoadmapView
            key="roadmap"
            currentStep={roadmapStep}
            content={currentContent.roadmap}
            emailContent={currentContent.email}
          />
        )}
      </AnimatePresence>
    </div>
  );
};

export default function Proactive() {
  return (
    <div className="bg-grid-white/[0.05] relative min-h-screen w-full overflow-x-hidden bg-[radial-gradient(ellipse_at_top_left,_#0f0f0f,_#09090b)] bg-cover bg-fixed bg-no-repeat">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,187,255,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />

      <div className="relative z-10 container mx-auto flex min-h-screen w-[1280px] flex-col items-center justify-center gap-12 py-16 sm:py-24">
        <LargeHeader
          headingText="An Assistant That Acts Before You Ask"
          subHeadingText="GAIA intelligently handles emails, schedules, presentations, and tasks so you can focus on what truly matters."
        />
        <ProactiveDemo />
      </div>
    </div>
  );
}
