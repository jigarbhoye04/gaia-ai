import React, { useEffect, useReducer, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import {
  Calendar as CalendarIcon,
  Clock,
  Plus,
  Check,
  Zap,
  ChevronLeft,
  ChevronRight,
  User
} from 'lucide-react';
import SectionChip from '@/features/landing/components/shared/SectionChip';

// --- RESTRUCTURED DATA FOR ONE-EVENT CYCLES ---
const scenarios = [
  {
    prompt: "Hey GAIA, plan my day. I need a gym session at 7 AM.",
    keywords: ["gym session at 7 AM"],
    event: { id: 101, title: "Gym Session", startTime: "7:00 AM", endTime: "8:00 AM", color: "#D32F2F" }
  },
  {
    prompt: "Can you block out 2 hours for deep work starting at 9 AM?",
    keywords: ["deep work", "9 AM"],
    event: { id: 102, title: "Deep Work Block", startTime: "9:00 AM", endTime: "11:00 AM", color: "#1976D2" }
  },
  {
    prompt: "Add a roadmap review to my calendar for 11:30 AM.",
    keywords: ["roadmap review", "11:30 AM"],
    event: { id: 103, title: "Roadmap Review", startTime: "11:30 AM", endTime: "12:30 PM", color: "#7B1FA2" }
  },
  {
    prompt: "I need to set up my schedule for the design sprint kickoff. Book a team brunch for 10 AM.",
    keywords: ["team brunch for 10 AM"],
    event: { id: 201, title: "Team Brunch", startTime: "10:00 AM", endTime: "11:00 AM", color: "#FBC02D" }
  },
  {
    prompt: "Schedule a 2-hour sprint planning session from 12 PM.",
    keywords: ["sprint planning session", "12 PM"],
    event: { id: 202, title: "Sprint Planning", startTime: "12:00 PM", endTime: "2:00 PM", color: "#1976D2" }
  },
  {
    prompt: "Book a client meeting for 3 PM.",
    keywords: ["client meeting at 3 PM"],
    event: { id: 203, title: "Client Feedback Meeting", startTime: "3:00 PM", endTime: "4:00 PM", color: "#7B1FA2" }
  }
];

type Event = typeof scenarios[0]['event'];

const timeToMinutes = (timeStr: string) => {
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map(Number);
  if (modifier === 'PM' && hours < 12) hours += 12;
  if (modifier === 'AM' && hours === 12) hours = 0;
  return hours * 60 + (minutes || 0);
};


const LargeHeader: React.FC<{ headingText: string; subHeadingText: string }> = ({ headingText, subHeadingText }) => (
  <header className="text-center">
    <SectionChip icon={CalendarIcon} text="Smart Calendar" />
    <motion.h1
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.1 }}
      className="text-3xl md:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent leading-tight mb-6"
    >
      {headingText}
    </motion.h1>
    <motion.p
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.7, ease: "easeOut", delay: 0.2 }}
      className="text-base md:text-lg lg:text-xl text-gray-400 max-w-4xl mx-auto leading-relaxed"
    >
      {subHeadingText}
    </motion.p>
  </header>
);

const HighlightedText: React.FC<{ text: string; keywords: string[]; stage: string }> = ({ text, keywords, stage }) => {
  // Highlight should animate in during 'processing' and stay visible afterwards for the cycle.
  const shouldHighlight = ['processing', 'suggesting', 'waiting', 'completed'].includes(stage);
  const regex = new RegExp(`(${keywords.join('|')})`, 'gi');
  const parts = text.split(regex);

  return (
    <p className="leading-relaxed">
      {parts.map((part, index) => {
        const isKeyword = keywords.some(kw => kw.toLowerCase() === part.toLowerCase());
        return isKeyword ? (
          <span key={index} className="relative inline-block">
            <motion.span
              className="absolute inset-0 bg-[#01BBFF]/50 rounded"
              initial={{ width: 0 }}
              // Animate to 100% width when highlighted
              animate={{ width: shouldHighlight ? '100%' : '0%' }}
              // Only apply a delayed transition during the 'processing' stage for the reveal effect
              transition={{
                duration: 0.4,
                delay: stage === 'processing' ? 0.5 + index * 0.2 : 0,
                ease: 'easeOut'
              }}
            />
            <span className="relative">{part}</span>
          </span>
        ) : (
          <span key={index}>{part}</span>
        );
      })}
    </p>
  );
};

const UserMessage: React.FC<{ text: string; keywords: string[]; stage: string; }> = ({ text, keywords, stage }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="flex items-start gap-3 justify-end mb-4"
    >
        <div className="flex-1 max-w-md">
            <div className="bg-zinc-700 rounded-2xl rounded-tr-none p-3 text-gray-200 text-sm">
                <HighlightedText text={text} keywords={keywords} stage={stage} />
            </div>
        </div>
        <div className="w-8 h-8 bg-gray-600 rounded-full flex items-center justify-center flex-shrink-0">
            <User className="w-4 h-4 text-white" />
        </div>
    </motion.div>
);

const GaiaMessage: React.FC<{ children: React.ReactNode; isSuggestion?: boolean }> = ({ children, isSuggestion = false }) => (
    <motion.div
        layout
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95, transition: { duration: 0.3 } }}
        transition={{ type: "spring", stiffness: 400, damping: 40 }}
        className="flex items-start gap-3"
    >
        <div className="w-8 h-8 bg-[#01BBFF] rounded-full flex items-center justify-center flex-shrink-0">
            <Zap className="w-4 h-4 text-white" />
        </div>
        <div className={`flex-1 ${isSuggestion ? '' : 'max-w-md'}`}>
            {children}
        </div>
    </motion.div>
);

const CalendarEventDialog: React.FC<{ event: Event; onAdd: () => void; }> = ({ event, onAdd }) => (
    <motion.div
        initial={{ opacity: 0, y: 20, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: -20, scale: 0.95 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="flex w-full flex-col gap-1 rounded-2xl rounded-bl-none bg-zinc-800 p-3 max-w-sm"
    >
        <div className="text-white mb-2 text-sm">Ready to add this to your calendar?</div>
        <div className="flex w-full flex-col gap-3 rounded-xl bg-zinc-900/80 p-3 border border-zinc-700/50">
            <div className="relative flex w-full flex-row gap-3">
                <div className="absolute inset-y-0 left-0 w-1 rounded-full" style={{ backgroundColor: event.color }}></div>
                <div className="flex flex-1 flex-col pl-3">
                    <div className="font-medium text-white">{event.title}</div>
                    <div className="text-xs text-gray-400 mt-1.5 space-y-1">
                        <div className="flex items-center gap-2"><Clock className="w-3 h-3 text-gray-500" /><span>{event.startTime} – {event.endTime}</span></div>
                    </div>
                </div>
            </div>
            <motion.button onClick={onAdd} whileTap={{ scale: 0.95 }} className="w-full bg-[#01BBFF] text-white text-sm font-semibold py-2 rounded-lg flex items-center justify-center gap-2 hover:bg-[#01BBFF]/90 transition-colors">
                <Plus className="w-4 h-4" /> Add to Calendar
            </motion.button>
        </div>
    </motion.div>
);

const DayViewCalendar: React.FC<{ addedEvent: Event | null }> = ({ addedEvent }) => {
    const hours = Array.from({ length: 14 }, (_, i) => i + 7); // 7 AM to 8 PM
    const scrollContainerRef = useRef<HTMLDivElement>(null);

    // --- Constants for positioning ---
    const DAY_START_MINUTES = timeToMinutes("7:00 AM");
    const HOUR_HEIGHT_PX = 80; // Corresponds to h-20 in Tailwind
    const PX_PER_MINUTE = HOUR_HEIGHT_PX / 60;

    // Effect to scroll to the new event when it's added
    useEffect(() => {
        if (addedEvent && scrollContainerRef.current) {
            const container = scrollContainerRef.current;
            const eventStartMinutes = timeToMinutes(addedEvent.startTime);

            // Calculate the pixel position of the event from the top of the scrollable area
            const eventTopPx = (eventStartMinutes - DAY_START_MINUTES) * PX_PER_MINUTE;

            // Desired scroll position: try to center the event or at least show its start
            const desiredScrollTop = eventTopPx - HOUR_HEIGHT_PX * 2; // Position event 2 hours down from top

            container.scrollTo({
                top: Math.max(0, desiredScrollTop), // Ensure we don't scroll to a negative value
                behavior: 'smooth',
            });
        }
    }, [addedEvent]);

    return (
        <motion.div className="bg-white rounded-2xl w-full max-w-lg h-[550px] flex flex-col overflow-hidden shadow-2xl border border-gray-200/50" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}>
            <div className="bg-white border-b border-gray-200 px-4 py-3 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/640px-Google_Calendar_icon_%282020%29.svg.png" alt="Google Calendar" className="w-7 h-7" />
                        <h2 className="text-lg font-medium text-gray-800">
                          {new Date().toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'long',
                            day: 'numeric',
                          })}
                        </h2>
                    </div>
                    <div className="flex items-center gap-1">
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronLeft className="w-5 h-5 text-gray-500" /></button>
                        <button className="p-2 rounded-full hover:bg-gray-100 transition-colors"><ChevronRight className="w-5 h-5 text-gray-500" /></button>
                    </div>
                </div>
            </div>
            <div className="flex-1 overflow-y-auto px-4" ref={scrollContainerRef}>
                <div className="relative flex">
                    <div className="w-16 text-right pr-2 shrink-0">
                        {hours.map((hour, index) => (
                          <div key={`time-${hour}`} className="h-20 flex items-start">
                            {/* Hide the first label to prevent overlap with the header */}
                            {index > 0 && (
                              <span className="text-xs text-gray-500 -translate-y-1/2">
                                {hour % 12 === 0 ? 12 : hour % 12} {hour < 12 || hour === 24 ? 'AM' : 'PM'}
                              </span>
                            )}
                          </div>
                        ))}
                    </div>
                    <div className="relative flex-1 grid grid-cols-1">
                        {hours.map(hour => (<div key={`line-${hour}`} className="h-20 border-t border-gray-200"></div>))}
                        <div className="absolute inset-0">
                            <AnimatePresence>
                                {addedEvent && (() => {
                                    const topPx = (timeToMinutes(addedEvent.startTime) - DAY_START_MINUTES) * PX_PER_MINUTE;
                                    const heightPx = (timeToMinutes(addedEvent.endTime) - timeToMinutes(addedEvent.startTime)) * PX_PER_MINUTE;

                                    return (
                                        <motion.div
                                          key={`event-${addedEvent.id}`}
                                          layout
                                          initial={{ opacity: 0, y: 20, scale: 0.9 }}
                                          animate={{ opacity: 1, y: 0, scale: 1 }}
                                          exit={{ opacity: 0, scale: 0.9 }}
                                          transition={{ type: 'spring', stiffness: 300, damping: 30, duration: 0.6 }}
                                          className="absolute w-[calc(100%-1rem)] left-2 p-2 rounded-lg text-white text-xs flex flex-col"
                                          style={{
                                              top: `${topPx}px`,
                                              height: `${heightPx}px`,
                                              backgroundColor: addedEvent.color
                                          }}>
                                            <p className="font-bold">{addedEvent.title}</p>
                                            <p className="opacity-80">{addedEvent.startTime} - {addedEvent.endTime}</p>
                                        </motion.div>
                                    );
                                })()}
                            </AnimatePresence>
                        </div>
                    </div>
                </div>
            </div>
        </motion.div>
    );
};

const StageIndicator: React.FC<{ stage: string }> = ({ stage }) => {
  const descriptions: { [key: string]: { icon: React.ElementType; text: string } } = {
    initial: { icon: Zap, text: "Ready for a prompt" },
    showing_prompt: { icon: User, text: "Receiving prompt..." },
    processing: { icon: Zap, text: "Extracting details..." },
    suggesting: { icon: Plus, text: "Suggesting event" },
    waiting: { icon: Clock, text: "Waiting for confirmation" },
    completed: { icon: Check, text: "Event added!" }
  };
  const current = descriptions[stage];
  if (!current) return null;

  return (
    <div className="fixed flex top-8 left-1/2 transform -translate-x-1/2 z-50">
      <motion.div layout className="bg-black/80 backdrop-blur-lg text-white rounded-full shadow-2xl border border-white/20 px-5 py-2.5" transition={{ type: "spring", stiffness: 400, damping: 30 }}>
        <AnimatePresence mode="wait">
          <motion.div key={stage} initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }} transition={{ duration: 0.3, ease: "easeInOut" }} className="flex items-center gap-3">
            <current.icon className="w-5 h-5 text-[#01BBFF]" />
            <span className="text-sm font-medium">{current.text}</span>
          </motion.div>
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// --- REFACTORED STATE MACHINE LOGIC ---

type Message =
    | { type: 'user_prompt'; id: string; text: string; keywords: string[] }
    | { type: 'gaia_intro'; id: string; text: string }
    | { type: 'gaia_suggestion'; id: string; event: Event }
    | { type: 'gaia_completion'; id: string; text: string };

type State = {
    stage: 'initial' | 'showing_prompt' | 'processing' | 'suggesting' | 'waiting' | 'completed';
    scenarioIndex: number;
    messages: Message[];
    addedEvent: Event | null;
};

type Action =
    | { type: 'START_CYCLE' }
    | { type: 'SHOW_PROMPT' }
    | { type: 'PROCESS_PROMPT' }
    | { type: 'SUGGEST_EVENT' }
    | { type: 'ADD_EVENT' };

const initialState: State = {
    stage: 'initial',
    scenarioIndex: -1,
    messages: [],
    addedEvent: null,
};

function animationReducer(state: State, action: Action): State {
    switch (action.type) {
        case 'START_CYCLE': {
            const nextScenarioIndex = (state.scenarioIndex + 1) % scenarios.length;
            return {
                ...initialState,
                stage: 'showing_prompt',
                scenarioIndex: nextScenarioIndex,
            };
        }
        case 'SHOW_PROMPT': {
            const scenario = scenarios[state.scenarioIndex];
            return {
                ...state,
                stage: 'processing',
                messages: [{ type: 'user_prompt', id: `prompt-${state.scenarioIndex}`, text: scenario.prompt, keywords: scenario.keywords }],
            };
        }
        case 'PROCESS_PROMPT': {
            return {
                ...state,
                stage: 'suggesting',
                messages: [
                    ...state.messages,
                    { type: 'gaia_intro', id: 'gaia-intro', text: "Of course! Here is a plan based on your request." },
                ],
            };
        }
        case 'SUGGEST_EVENT': {
            const scenario = scenarios[state.scenarioIndex];
            return {
                ...state,
                stage: 'waiting',
                messages: [
                    ...state.messages,
                    { type: 'gaia_suggestion', id: `suggestion-${scenario.event.id}`, event: scenario.event },
                ],
            };
        }
        case 'ADD_EVENT': {
            const scenario = scenarios[state.scenarioIndex];
            return {
                ...state,
                stage: 'completed',
                addedEvent: scenario.event,
                messages: [
                    ...state.messages.filter(m => m.id !== `suggestion-${scenario.event.id}`),
                    { type: 'gaia_completion', id: 'completed-msg', text: "Great! Your calendar is up to date." }
                ]
            };
        }
        default:
            return state;
    }
}


// --- MAIN DEMO COMPONENT ---
const CalendarDemo: React.FC = () => {
  const { ref, inView } = useInView({ triggerOnce: true, threshold: 0.5 });
  const [state, dispatch] = useReducer(animationReducer, initialState);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (inView && state.stage === 'initial') {
        dispatch({ type: 'START_CYCLE' });
    }
  }, [inView, state.stage]);

  useEffect(() => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current);

    switch (state.stage) {
        case 'showing_prompt':
            timeoutRef.current = setTimeout(() => dispatch({ type: 'SHOW_PROMPT' }), 500);
            break;
        case 'processing':
            timeoutRef.current = setTimeout(() => dispatch({ type: 'PROCESS_PROMPT' }), 2500); // Longer delay for highlight animation
            break;
        case 'suggesting':
            timeoutRef.current = setTimeout(() => dispatch({ type: 'SUGGEST_EVENT' }), 1000);
            break;
        case 'completed':
            timeoutRef.current = setTimeout(() => dispatch({ type: 'START_CYCLE' }), 4000);
            break;
        default:
            break;
    }

    return () => { if (timeoutRef.current) clearTimeout(timeoutRef.current) };
  }, [state.stage]);

  const handleAddEvent = () => {
    dispatch({ type: 'ADD_EVENT' });
  };

  const renderMessage = (message: Message) => {
    switch (message.type) {
        case 'user_prompt':
            return <UserMessage key={message.id} text={message.text} keywords={message.keywords} stage={state.stage} />;
        case 'gaia_intro':
            return (
                <GaiaMessage key={message.id}>
                    <div className="bg-zinc-800 rounded-2xl rounded-tl-none p-3 text-white text-sm"><p>{message.text}</p></div>
                </GaiaMessage>
            );
        case 'gaia_suggestion':
            return (
                <GaiaMessage key={message.id} isSuggestion>
                    <CalendarEventDialog event={message.event} onAdd={handleAddEvent} />
                </GaiaMessage>
            );
        case 'gaia_completion':
             return (
                <GaiaMessage key={message.id}>
                    <div className="bg-green-600/20 border border-green-500/30 rounded-2xl rounded-tl-none p-3">
                        <p className="text-sm font-medium text-green-300">{message.text}</p>
                    </div>
                </GaiaMessage>
            );
        default:
            return null;
    }
  };

  return (
    <div ref={ref} className="relative bg-gradient-to-br from-white/[0.02] to-transparent backdrop-blur-2xl rounded-3xl border border-white/10 shadow-2xl shadow-black/40 w-full max-w-7xl h-[700px] flex items-center justify-center overflow-hidden p-4 md:p-8">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_40%,rgba(1,187,255,0.1),transparent_50%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(6,182,212,0.1),transparent_50%)] pointer-events-none" />
      <StageIndicator stage={state.stage} />
      <div className="w-full h-full grid grid-cols-1 lg:grid-cols-2 gap-8 items-center mt-12">
        <div className="h-full flex flex-col justify-center">
          <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6, ease: "easeOut" }} className="mb-6">
            <h3 className="text-2xl font-bold text-white mb-2">Smart Scheduling</h3>
            <p className="text-gray-400">GAIA suggests events for you to confirm.</p>
          </motion.div>
          <motion.div layout className="space-y-4 h-96 overflow-y-auto pr-2 flex flex-col-reverse">
              <AnimatePresence mode="popLayout">
                {state.messages.slice().reverse().map(renderMessage)}
              </AnimatePresence>
          </motion.div>
        </div>
        <div className="flex items-center justify-center h-full">
          <DayViewCalendar addedEvent={state.addedEvent} />
        </div>
      </div>
    </div>
  );
};

export default function Calendar() {
  return (
    <div className="relative min-h-screen w-full bg-[#09090b] bg-fixed bg-no-repeat bg-cover overflow-x-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_#0f0f0f,_#09090b)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      <div className="relative z-10 container mx-auto py-12 sm:py-16 md:py-24 flex flex-col items-center justify-center gap-12 md:gap-16 min-h-screen max-w-7xl px-4">
        <LargeHeader headingText="Intelligent Calendar Management" subHeadingText="GAIA automatically creates, schedules, and organizes your events with perfect timing and smart conflict resolution." />
        <CalendarDemo />
      </div>
    </div>
  );
}