import React, { useState, useEffect, useLayoutEffect, useRef, useCallback, ElementType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { Check, Clock, GitBranch, Search, BookOpen, Users, Target, Zap, Star, Archive, Reply, Presentation, ArrowRight, Undo2, Redo2, Printer, Paintbrush2, ZoomIn, MousePointer2, Type, Image as ImageIcon, Shapes, PenLine, MessageSquarePlus, LayoutPanelLeft, Palette, Film, PlusSquare, ChevronDown } from 'lucide-react';
import { demoContents, DemoData } from './demo-data'; // Adjust the import path if needed

// --- Helper & Header Components ---
const wait = (ms: number): Promise<void> => new Promise(resolve => setTimeout(resolve, ms));

const LargeHeader: React.FC<{ headingText: string; subHeadingText: string }> = ({ headingText, subHeadingText }) => (
  <header className="text-center">
    <motion.div 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut' }}
      className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#01BBFF]/20 to-[#01BBFF]/10 border border-[#01BBFF]/30 backdrop-blur-sm mb-6"
    >
      <div className="w-2 h-2 bg-[#01BBFF] rounded-full animate-pulse" />
      <span className="text-sm font-medium text-[#01BBFF]">Proactive Intelligence</span>
    </motion.div>
    <motion.h1 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.1 }}
      className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-tight mb-6"
    >
      {headingText}
    </motion.h1>
    <motion.p 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: 'easeOut', delay: 0.2 }}
      className="text-lg md:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed"
    >
      {subHeadingText}
    </motion.p>
  </header>
);

const GoogleLogo: React.FC<{ src: string; alt: string; className?: string }> = ({ src, alt, className }) => (
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

const GmailView: React.FC<{ isExpanded: boolean; highlightTrigger: boolean; content: DemoData['email'] }> = ({ isExpanded, highlightTrigger, content }) => {
    const containerVariants = {
        collapsed: { height: '80px' },
        expanded: { height: '450px' },
    };

    return (
        <motion.div
            layoutId="main-container"
            variants={containerVariants}
            initial="collapsed"
            animate={isExpanded ? "expanded" : "collapsed"}
            transition={{ duration: 0.8, ease: [0.32, 0.72, 0, 1] }}
            className="bg-[#F2F6FC] rounded-2xl w-full max-w-3xl overflow-hidden shadow-2xl"
        >
            <div className="p-4 flex flex-col h-full">
                <motion.div layout="position" className="flex items-center gap-4 flex-shrink-0">
                    <GoogleLogo src="https://upload.wikimedia.org/wikipedia/commons/7/7e/Gmail_icon_%282020%29.svg" alt="Gmail" className="w-8 h-8" />
                    <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-gray-800 text-base truncate">{content.subject}</h3>
                        <p className="text-gray-600 text-sm truncate">{content.sender} &lt;{content.senderEmail}&gt;</p>
                    </div>
                    <div className="flex items-center gap-4 text-gray-500 flex-shrink-0">
                        <Star className="w-5 h-5 hover:text-yellow-500 transition-colors" />
                        <Archive className="w-5 h-5 hover:text-gray-800 transition-colors" />
                        <Reply className="w-5 h-5 hover:text-gray-800 transition-colors" />
                    </div>
                </motion.div>

                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0, transition: { delay: 0.4, duration: 0.5 } }}
                            exit={{ opacity: 0 }}
                            className="flex-grow mt-4 pt-4 border-t border-gray-200 space-y-4 overflow-auto"
                        >
                            <p className="text-gray-700 leading-relaxed text-sm">
                                {content.body(highlightTrigger)}
                            </p>
                            <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0, transition: { delay: 2.0, duration: 0.5 } }}
                                className="flex items-center gap-3 text-sm text-[#01BBFF] bg-[#01BBFF]/5 p-4 rounded-xl border border-[#01BBFF]/20"
                            >
                                <Zap className="w-5 h-5 text-[#01BBFF] flex-shrink-0" />
                                <span className="font-medium">GAIA is creating your action plan...</span>
                                <div className="ml-auto flex space-x-1">
                                    <div className="w-1.5 h-1.5 bg-[#01BBFF] rounded-full animate-bounce" style={{ animationDelay: '0s' }}></div>
                                    <div className="w-1.5 h-1.5 bg-[#01BBFF] rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                                    <div className="w-1.5 h-1.5 bg-[#01BBFF] rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                                </div>
                            </motion.div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};

const CalendarView: React.FC<{ content: DemoData['calendar'], emailContent: DemoData['email'] }> = ({ content, emailContent }) => (
    <motion.div layoutId="main-container" className="bg-white rounded-2xl w-full max-w-5xl h-[600px] md:h-[550px] flex flex-col md:flex-row overflow-hidden shadow-2xl">
        <div className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-gray-200 p-4 flex flex-col">
            <div className="flex items-center gap-2 mb-6 p-2">
                <GoogleLogo src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/640px-Google_Calendar_icon_%282020%29.svg.png" alt="Google Calendar" className="w-8 h-8" />
                <span className="font-semibold text-gray-700 text-xl">Calendar</span>
            </div>
            <div className="text-center">
                <div className="font-semibold text-gray-800 mb-2">{content.month} {content.year}</div>
                <div className="grid grid-cols-7 gap-1 text-xs text-gray-500 mb-2">
                    {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map(d => <div key={d}>{d}</div>)}
                </div>
                <div className="grid grid-cols-7 gap-1 text-sm">
                    {/* Simplified calendar view for demo purposes */}
                    {Array.from({ length: 5 }).map((_, i) => <div key={`empty-${i}`} />)} 
                    {Array.from({ length: 31 }, (_, i) => (
                        <div key={i} className={`p-1 rounded-full aspect-square flex items-center justify-center cursor-pointer ${i + 1 === content.dueDay ? 'bg-blue-600 text-white font-bold' : 'text-gray-700 hover:bg-gray-100'}`}>
                            {i + 1}
                        </div>
                    ))}
                </div>
            </div>
             <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1, transition: { delay: 1.5 } }}
                className="mt-auto flex items-center gap-2 text-sm text-blue-700 bg-blue-100 p-2 rounded-lg"
            >
                <Check className="w-4 h-4" />
                <span>Deadline added to calendar</span>
            </motion.div>
        </div>
        <div className="flex-1 bg-white p-6">
            <div className="flex items-baseline justify-between mb-4">
                <h2 className="text-xl md:text-2xl font-normal text-gray-700">
                    <span className="font-bold text-blue-600">{content.dayOfWeek},</span> {content.month} {content.dueDay}
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
                    animate={{ opacity: 1, y: 0, scale: 1, transition: { delay: 0.5, duration: 0.6, ease: [0.22, 1, 0.36, 1] } }}
                    className="absolute top-[60.33%] left-4 right-4 h-20 bg-blue-100 border-l-4 border-blue-500 rounded-lg p-3 flex items-start gap-4 shadow-lg"
                >
                    <div className="flex-1">
                        <h3 className="font-semibold text-blue-900 text-sm">{emailContent.subject}</h3>
                        <p className="text-blue-800 text-xs">{emailContent.topic}</p>
                    </div>
                    <div className="flex items-center gap-2 text-xs text-blue-800">
                        <Clock className="w-3 h-3" />
                        <span>11:59 PM</span>
                    </div>
                </motion.div>
            </div>
        </div>
    </motion.div>
);

const SlidesView: React.FC<{ content: DemoData['slides'], emailContent: DemoData['email'], onComplete: () => void }> = ({ content, emailContent, onComplete }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);

  useEffect(() => {
      if (currentSlideIndex >= content.length -1) {
          const finalTimer = setTimeout(onComplete, 2500);
          return () => clearTimeout(finalTimer);
      }
      
      const timer = setTimeout(() => {
          setCurrentSlideIndex(prev => prev + 1);
      }, 2500);

      return () => clearTimeout(timer);
  }, [currentSlideIndex, content.length, onComplete]);

  const currentSlide = content[currentSlideIndex];

  type ToolbarIconProps = {
    icon: ElementType;
    active?: boolean;
    hasDropdown?: boolean;
  };
  
  const ToolbarIcon: React.FC<ToolbarIconProps> = ({ icon: Icon, active = false, hasDropdown = false }) => (
      <button className={`p-1.5 rounded hover:bg-gray-200 ${active ? 'bg-blue-100 text-blue-600' : 'text-gray-600'}`}>
          <div className="flex items-center">
              <Icon className="w-5 h-5" />
              {hasDropdown && <ChevronDown className="w-3 h-3 ml-0.5" />}
          </div>
      </button>
  );

  return (
      <motion.div layoutId="main-container" className="bg-[#F8F9FA] rounded-2xl w-full max-w-7xl h-[600px] flex flex-col overflow-hidden shadow-2xl">
          {/* Top Menu Bar */}
          <div className="bg-white border-b border-gray-300 px-2 py-1 text-sm text-gray-800">
              <div className="flex items-center gap-3">
                  <GoogleLogo src="https://upload.wikimedia.org/wikipedia/commons/thumb/1/16/Google_Slides_2020_Logo.svg/640px-Google_Slides_2020_Logo.svg.png" alt="Google Slides" className="w-8 h-8 flex-shrink-0" />
                  <div className="flex flex-col flex-grow min-w-0">
                      <span className="font-medium truncate">{emailContent.topic}</span>
                      <div className="flex items-center gap-4 text-xs text-gray-600 mt-1">
                           <Star className="w-4 h-4 text-gray-500 hover:text-yellow-500 cursor-pointer"/>
                           <span className="hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer">File</span>
                           <span className="hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer">Edit</span>
                           <span className="hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer">View</span>
                           <span className="hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer">Insert</span>
                           <span className="hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer">Format</span>
                           <span className="hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer">Slide</span>
                           <span className="hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer">Arrange</span>
                           <span className="hover:bg-gray-100 px-1 py-0.5 rounded cursor-pointer">Tools</span>
                      </div>
                  </div>
                  <div className="ml-auto flex items-center gap-3 flex-shrink-0">
                       <motion.div initial={{opacity: 0}} animate={{opacity: 1, transition:{delay: 1}}} className="hidden md:flex items-center gap-2 bg-green-100 px-3 py-1 rounded-full">
                          <Zap className="w-4 h-4 text-green-700" />
                          <span className="text-xs font-medium text-green-800">Draft by GAIA</span>
                      </motion.div>
                      <button className="hidden sm:flex items-center gap-1.5 bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded text-sm font-medium text-gray-800">
                         <Presentation className="w-5 h-5" />
                         Slideshow
                      </button>
                      <button className="bg-[#1A73E8] text-white px-5 py-2 rounded-md text-sm font-semibold">Share</button>
                  </div>
              </div>
          </div>
          
          {/* Toolbar */}
          <div className="bg-white border-b border-gray-200 px-3 py-1 flex items-center gap-1 flex-shrink-0 flex-wrap">
              <ToolbarIcon icon={PlusSquare} hasDropdown />
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <ToolbarIcon icon={Undo2} />
              <ToolbarIcon icon={Redo2} />
              <ToolbarIcon icon={Printer} />
              <ToolbarIcon icon={Paintbrush2} />
              <ToolbarIcon icon={ZoomIn} hasDropdown />
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <ToolbarIcon icon={MousePointer2} active />
              <ToolbarIcon icon={Type} />
              <ToolbarIcon icon={ImageIcon} />
              <ToolbarIcon icon={Shapes} hasDropdown />
              <ToolbarIcon icon={PenLine} hasDropdown />
              <div className="w-px h-6 bg-gray-300 mx-1"></div>
              <div className="flex items-center gap-1">
                 <button className="text-sm px-2 py-1 hover:bg-gray-100 rounded">Background</button>
                 <button className="text-sm px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">Layout <ChevronDown className="w-4 h-4" /></button>
                 <button className="text-sm px-2 py-1 hover:bg-gray-100 rounded flex items-center gap-1">Theme <ChevronDown className="w-4 h-4" /></button>
                 <button className="text-sm px-2 py-1 hover:bg-gray-100 rounded">Transition</button>
              </div>
          </div>

          <div className="flex-1 flex overflow-hidden bg-[#E9EEF6]">
              {/* Left Slide Panel */}
              <div className="w-48 bg-white border-r border-gray-200 p-3 space-y-3 overflow-y-auto">
                  {content.map((slide, i) => (
                      <div key={i} className="relative p-1 rounded-sm cursor-pointer group">
                           <span className="absolute top-1 left-2 text-xs text-gray-500 z-10">{i + 1}</span>
                          {i === currentSlideIndex && (
                              <motion.div layoutId="active-slide-indicator" className="absolute inset-0 border-2 border-blue-500 rounded-sm" transition={{type: 'spring', stiffness: 300, damping: 30 }} />
                          )}
                          <div className={`relative aspect-video bg-white border border-gray-400 rounded-sm flex items-center justify-center p-1 ${i !== currentSlideIndex ? 'group-hover:border-gray-500' : ''}`}>
                              <p className="text-[9px] font-semibold text-gray-600 px-1 text-center">{slide.title}</p>
                          </div>
                      </div>
                  ))}
              </div>
              
              <div className="flex-1 flex flex-col">
                  <div className="flex flex-1 overflow-hidden">
                      <div className="flex-1 flex items-center justify-center p-8">
                           <AnimatePresence mode="wait">
                              <motion.div
                                  key={currentSlideIndex}
                                  initial={{ opacity: 0, scale: 0.95 }}
                                  animate={{ opacity: 1, scale: 1, transition: { duration: 0.5, ease: 'easeOut' } }}
                                  exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.3, ease: 'easeIn' } }}
                                  className={`w-full h-full shadow-lg rounded-sm flex flex-col justify-between text-left p-8 border border-gray-300 ${currentSlide.bgColor} ${currentSlide.textColor}`}
                              >
                                  <div>
                                      <h1 className={`text-4xl font-bold mb-4 ${currentSlide.highlightColor}`}>{currentSlide.title}</h1>
                                      {currentSlide.subtitle && <p className="text-xl opacity-80">{currentSlide.subtitle}</p>}
                                      {currentSlide.points && (
                                          <ul className="mt-6 space-y-3 text-base">
                                              {currentSlide.points.map((point, i) => (
                                                  <motion.li 
                                                      key={i} 
                                                      className="flex items-start gap-3"
                                                      initial={{ opacity: 0, x: -20 }}
                                                      animate={{ opacity: 1, x: 0, transition: { delay: 0.3 + i * 0.2 } }}
                                                  >
                                                      <ArrowRight className={`w-5 h-5 mt-1 flex-shrink-0 ${currentSlide.highlightColor}`} />
                                                      <span>{point}</span>
                                                  </motion.li>
                                              ))}
                                          </ul>
                                      )}
                                  </div>
                                  {currentSlide.image && (
                                      <motion.div 
                                          className="flex justify-center my-4"
                                          initial={{ opacity: 0, scale: 0.8 }}
                                          animate={{ opacity: 1, scale: 1, transition: { delay: 0.5 }}}
                                      >
                                          <img src={currentSlide.image} alt={currentSlide.title} className="max-h-40 object-contain rounded-lg bg-white/10 p-2" />
                                      </motion.div>
                                  )}
                                   <div className="mt-auto text-xs opacity-60 text-right">
                                      Slide {currentSlideIndex + 1} of {content.length}
                                  </div>
                              </motion.div>
                          </AnimatePresence>
                      </div>
                  </div>
              </div>
          </div>
           {currentSlideIndex === content.length -1 && (
               <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1, transition: { delay: 1 } }}
                  className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 text-sm text-green-700 bg-green-100 p-2 rounded-lg shadow-md"
              >
                  <Check className="w-4 h-4" />
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
    window.addEventListener('resize', updateSize);
    updateSize();
    return () => window.removeEventListener('resize', updateSize);
  }, []);
  return size;
};

const AnimatedPath: React.FC<{ d: string; isActive: boolean }> = ({ d, isActive }) => (
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
      pathLength: { delay: 0.2, type: "tween", duration: 0.8, ease: "easeInOut" },
      opacity: { delay: 0.2, duration: 0.01 },
    }}
    style={{ stroke: 'url(#line-gradient)' }}
  />
);

const RoadmapView: React.FC<{ currentStep: number; content: DemoData['roadmap']; emailContent: DemoData['email'] }> = ({ currentStep, content, emailContent }) => {
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

        const startX = startRect.left + startRect.width / 2 - containerRect.left;
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
      className="bg-gray-50 rounded-2xl w-full max-w-6xl h-auto min-h-[550px] flex flex-col justify-center p-8 md:p-12 shadow-2xl overflow-hidden"
    >
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0, transition: { delay: 0.2, duration: 0.5 } }}
        className="w-full"
      >
        <div className="flex items-center justify-between mb-20 md:mb-16">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Target className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{emailContent.topic}</h2>
              <p className="text-gray-500">AI-Generated Project Plan</p>
            </div>
          </div>
          <AnimatePresence>
            {currentStep >= content.length && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="hidden md:flex items-center gap-2 bg-green-100 px-4 py-2 rounded-full text-sm"
              >
                <Check className="w-5 h-5 text-green-700" />
                <span className="font-medium text-green-800">Project Finalized</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>

      <div ref={containerRef} className="relative w-full h-48">
        <svg className="absolute inset-0 w-full h-full z-0" aria-hidden="true">
          <defs>
            <linearGradient id="line-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#60A5FA" />
              <stop offset="100%" stopColor="#3B82F6" />
            </linearGradient>
          </defs>
          <g>
            {paths.map((path, index) => (
              <AnimatedPath key={index} d={path} isActive={currentStep > index} />
            ))}
          </g>
        </svg>

        <div className="relative z-10 flex justify-between items-center h-full">
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
                  transform: `translateY(${index % 2 === 0 ? '-40px' : '40px'})`,
                }}
              >
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ delay: 0.4 + index * 0.1, type: 'spring', stiffness: 250, damping: 20 }}
                >
                  <motion.div
                    animate={{ scale: isCurrent ? 1.15 : 1 }}
                    transition={{ type: 'spring', stiffness: 300, damping: 15 }}
                    className={`w-14 h-14 rounded-full flex items-center justify-center transition-all duration-300 relative shadow-lg ${
                      isCompleted ? 'bg-blue-500' :
                      isCurrent ? 'bg-blue-600 ring-4 ring-white/80' :
                      'bg-white border-2 border-gray-300'
                    }`}
                  >
                    <step.icon className={`w-7 h-7 transition-colors duration-300 ${
                      isCompleted || isCurrent ? 'text-white' : 'text-gray-400'
                    }`} />
                    {isCurrent && <div className="absolute inset-[-6px] border-2 border-blue-400 rounded-full animate-ping" />}
                  </motion.div>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.6 + index * 0.1, duration: 0.4 }}
                  className="w-28"
                >
                  <h4 className={`text-sm font-semibold transition-colors duration-300 ${
                    isCurrent ? 'text-blue-600' : isCompleted ? 'text-gray-900' : 'text-gray-500'
                  }`}>
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
        threshold: 0.4,    // Trigger when 40% of the component is visible
    });

    const [stage, setStage] = useState('gmail');
    const [isExpanded, setIsExpanded] = useState(false);
    const [highlightTrigger, setHighlightTrigger] = useState(false);
    const [roadmapStep, setRoadmapStep] = useState(-1);
    const [contentIndex, setContentIndex] = useState(0);
    const isMounted = useRef(true);

    const currentContent = demoContents[contentIndex];
    const totalRoadmapSteps = currentContent.roadmap.length;

    const animationSequence = useCallback(async () => {
        if (!isMounted.current) return;
        
        setStage('gmail');
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
        setStage('calendar');
        await wait(4000);
        
        if (!isMounted.current) return;
        setStage('slides');
        
    }, [contentIndex]);
    
    const handleSlidesComplete = useCallback(async () => {
        if (!isMounted.current) return;
        setStage('roadmap');
        await wait(1000);

        for (let i = 0; i <= totalRoadmapSteps; i++) {
            if (!isMounted.current) return;
            setRoadmapStep(i);
            await wait(1000);
        }

        await wait(4000); 
        
        if (isMounted.current) {
            setContentIndex(prev => (prev + 1) % demoContents.length);
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
        <div ref={ref} className="bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/40 w-full aspect-video md:aspect-[16/9] lg:aspect-auto lg:h-[665px] max-w-7xl flex items-center justify-center relative overflow-hidden md:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(1,187,255,0.1),transparent_50%)] pointer-events-none" />
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(6,182,212,0.1),transparent_50%)] pointer-events-none" />
            
            <AnimatePresence mode="wait">
                {stage === 'gmail' && (
                    <GmailView key="gmail" isExpanded={isExpanded} highlightTrigger={highlightTrigger} content={currentContent.email} />
                )}
                {stage === 'calendar' && (
                    <CalendarView key="calendar" content={currentContent.calendar} emailContent={currentContent.email} />
                )}
                {stage === 'slides' && (
                    <SlidesView key="slides" content={currentContent.slides} emailContent={currentContent.email} onComplete={handleSlidesComplete} />
                )}
                {stage === 'roadmap' && (
                     <RoadmapView key="roadmap" currentStep={roadmapStep} content={currentContent.roadmap} emailContent={currentContent.email} />
                )}
            </AnimatePresence>
        </div>
    );
};

export default function Proactive() {
  return (
    <div className="relative min-h-screen w-full bg-[radial-gradient(ellipse_at_top_left,_#0f0f0f,_#09090b)] bg-fixed bg-no-repeat bg-cover bg-grid-white/[0.05] overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,187,255,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <div className="relative z-10 container mx-auto py-16 sm:py-24 flex flex-col items-center justify-center gap-12 min-h-screen w-[1280px]">
        <LargeHeader
          headingText="An Assistant That Acts Before You Ask"
          subHeadingText="GAIA intelligently handles emails, schedules, presentations, and tasks so you can focus on what truly matters."
        />
        <ProactiveDemo />
      </div>
    </div>
  );
}