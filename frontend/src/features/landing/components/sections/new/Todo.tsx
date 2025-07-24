import React, { useState, useEffect } from 'react';
import { CheckCircle, Zap, Search, BarChart3, FolderOpen, ListTodo, Tag, MousePointer, Target, Calendar, User, Bot } from 'lucide-react';

interface TodoTool {
  title: string;
  description: string;
  icon: React.ReactNode;
}

const todoTools: TodoTool[] = [
  {
    title: "Smart Task Creation",
    description: "Add tasks and subtasks using natural language",
    icon: <Zap className="w-4 h-4" />
  },
  {
    title: "Organize & Prioritize",
    description: "Sort tasks by projects, labels, due dates, or priority",
    icon: <FolderOpen className="w-4 h-4" />
  },
  {
    title: "Quick Updates",
    description: "Edit, move, or delete tasks with simple commands",
    icon: <MousePointer className="w-4 h-4" />
  },
  {
    title: "Powerful Search",
    description: "Find tasks using keywords or semantic search",
    icon: <Search className="w-4 h-4" />
  },
  {
    title: "Bulk Actions",
    description: "Complete, move, or delete multiple tasks at once",
    icon: <CheckCircle className="w-4 h-4" />
  },
  {
    title: "Project Management",
    description: "Group tasks under color-coded projects",
    icon: <FolderOpen className="w-4 h-4" />
  },
  {
    title: "Subtasks",
    description: "Break big tasks into smaller steps",
    icon: <ListTodo className="w-4 h-4" />
  },
  {
    title: "Labels & Tags",
    description: "Categorize tasks with custom labels",
    icon: <Tag className="w-4 h-4" />
  },
  {
    title: "Task Statistics",
    description: "View progress and productivity stats",
    icon: <BarChart3 className="w-4 h-4" />
  },
  {
    title: "Priority Levels",
    description: "Focus using task priority settings",
    icon: <Target className="w-4 h-4" />
  },
  {
    title: "Due Dates",
    description: "Set and track task deadlines",
    icon: <Calendar className="w-4 h-4" />
  },
  {
    title: "Smart Notifications",
    description: "Get reminded at the perfect time",
    icon: <Zap className="w-4 h-4" />
  }
];

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

const ChatAnimation: React.FC = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [showCheckmark, setShowCheckmark] = useState(false);
  
  const messages = [
    { type: 'user', text: 'Create a task to review quarterly reports by Friday' },
    { type: 'ai', text: 'Task created successfully!' }
  ];
  
  const tasks = [
    { id: 1, text: 'Review quarterly reports', priority: 'high', completed: false },
    { id: 2, text: 'Schedule team meeting', priority: 'medium', completed: true },
    { id: 3, text: 'Update project documentation', priority: 'low', completed: false }
  ];

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentStep(prev => {
        if (prev === 0) {
          setTimeout(() => setCurrentStep(1), 1500);
          return 0;
        } else if (prev === 1) {
          setTimeout(() => {
            setShowCheckmark(true);
            setTimeout(() => {
              setShowCheckmark(false);
              setCurrentStep(0);
            }, 2000);
          }, 1000);
          return 1;
        }
        return 0;
      });
    }, 5000);
    
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="space-y-6">
      {/* Chat Interface */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
        <div className="space-y-3">
          {/* User Message */}
          <div className={`flex items-start justify-end gap-3 transition-all duration-500 ${currentStep >= 0 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="bg-slate-800/50 rounded-2xl px-4 py-2 max-w-xs">
              <p className="text-white text-sm">{messages[0].text}</p>
            </div>
            <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center">
              <User className="w-4 h-4 text-white" />
            </div>
          </div>
          
          {/* AI Response */}
          <div className={`flex items-start gap-3 justify-start transition-all duration-500 delay-1000 ${currentStep >= 1 ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#01BBFF] to-cyan-400 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="bg-[#01BBFF]/20 border border-[#01BBFF]/30 rounded-2xl px-4 py-2 max-w-xs">
              <p className="text-[#01BBFF] text-sm flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                {messages[1].text}
              </p>
            </div>
          </div>
        </div>
      </div>
      
      {/* Task List */}
      <div className="bg-slate-800/30 rounded-xl p-4 border border-white/5">
        <div className="space-y-2">
          {tasks.map((task, index) => (
            <div key={task.id} className={`flex items-center gap-3 p-3 rounded-lg bg-slate-800/30 transition-all duration-300 ${
              index === 0 && showCheckmark ? 'bg-[#01BBFF]/10 border border-[#01BBFF]/30' : ''
            }`}>
              <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all duration-300 ${
                task.completed || (index === 0 && showCheckmark)
                  ? 'border-[#01BBFF] bg-[#01BBFF]'
                  : 'border-slate-500'
              }`}>
                {(task.completed || (index === 0 && showCheckmark)) && (
                  <CheckCircle className="w-3 h-3 text-white" />
                )}
              </div>
              <span className={`text-sm flex-1 transition-all duration-300 ${
                task.completed ? 'text-slate-400 line-through' : 'text-white'
              }`}>
                {task.text}
              </span>
              <span className={`text-xs px-2 py-1 rounded-full ${
                task.priority === 'high' ? 'bg-red-500/20 text-red-400' :
                task.priority === 'medium' ? 'bg-yellow-500/20 text-yellow-400' :
                'bg-green-500/20 text-green-400'
              }`}>
                {task.priority}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default function Todo() {
  return (
    <div className="relative min-h-screen bg-[radial-gradient(ellipse_at_top_left,_#0f0f0f,_#09090b)] bg-fixed bg-no-repeat bg-cover overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(1,187,255,0.05),transparent_50%)]" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]" />
      
      <div className="relative z-10 container mx-auto py-20 max-w-7xl bg">
        {/* Header Section */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-gradient-to-r from-[#01BBFF]/20 to-[#01BBFF]/10 border border-[#01BBFF]/30 backdrop-blur-sm mb-6">
            <div className="w-2 h-2 bg-[#01BBFF] rounded-full animate-pulse" />
            <span className="text-sm font-medium text-[#01BBFF]">To-do lists</span>
          </div>
          <div className="relative mb-6">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-white via-white to-gray-400 bg-clip-text text-transparent leading-tight relative z-10">
              Save Hours on&nbsp;
              <span className="bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent">
                Task Management
              </span>
            </h1>
            <h1 className="absolute inset-0 text-4xl md:text-5xl lg:text-6xl font-bold bg-gradient-to-r from-[#9ddcff] to-[#5ac8fa] bg-clip-text text-transparent blur-lg opacity-20 pointer-events-none select-none">
              Save Hours on&nbsp;
              Task Management
            </h1>
          </div>

          <p className="text-xl md:text-2xl text-gray-400 max-w-2xl mx-auto leading-relaxed">
            Stop wasting time organizing your to-dos — GAIA manages everything for you through simple text.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
          {/* Chat Management Card */}
          <FeatureCard className="md:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="p-6 md:p-8 h-full flex flex-col min-h-[400px] lg:min-h-[500px]">
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Easily Manage Tasks Through Chat</h3>
                <p className="text-gray-400 text-sm md:text-base">Type messages to create and manage your tasks</p>
              </div>
              <div className="flex-1">
                <ChatAnimation />
              </div>
            </div>
          </FeatureCard>

          {/* Tools List Card */}
          <FeatureCard className="md:col-span-2 lg:col-span-2 lg:row-span-2">
            <div className="p-6 md:p-8 h-full min-h-[400px] lg:min-h-[500px]">
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">{todoTools.length}+ Todo Tools</h3>
                <p className="text-gray-400 text-sm md:text-base">Stop wasting time organizing to-do lists — GAIA turns your words into action instantly</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-80 overflow-y-auto custom-scrollbar">
                {todoTools.map((tool, index) => (
                  <div key={index} className="group/item">
                    <div className="bg-slate-800/30 backdrop-blur-sm border border-white/5 rounded-xl p-4 transition-all duration-300 hover:border-[#01BBFF]/20 hover:bg-slate-800/50">
                      <div className="flex items-start gap-3">
                        <div className="text-[#01BBFF] mt-1 opacity-70 group-hover/item:opacity-100 transition-opacity">
                          {tool.icon}
                        </div>
                        <div className="flex-1">
                          <h4 className="text-sm font-semibold text-white mb-1">{tool.title}</h4>
                          <p className="text-xs text-gray-400 leading-relaxed">{tool.description}</p>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </FeatureCard>

          {/* Easy Task Creation */}
          <FeatureCard className="md:col-span-2 lg:col-span-2">
            <div className="p-6 md:p-8 h-full min-h-[200px]">
              <div className="mb-6">
                <h3 className="text-xl md:text-2xl font-bold text-white mb-2">Easy Task Creation</h3>
                <p className="text-gray-400 text-sm md:text-base">Create tasks using everyday language</p>
              </div>
              <div className="bg-slate-800/30 rounded-xl p-4 md:p-6 border border-white/5">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#01BBFF] rounded-full" />
                    <span className="text-white text-sm">"Add meeting with John tomorrow at 2pm"</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#01BBFF] rounded-full" />
                    <span className="text-white text-sm">"Remind me to call mom this weekend"</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-2 h-2 bg-[#01BBFF] rounded-full" />
                    <span className="text-white text-sm">"Buy groceries after work"</span>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* View Task Details */}
          <FeatureCard className="lg:col-span-1">
            <div className="p-6 h-full min-h-[200px]">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">View Task Details</h3>
                <p className="text-sm text-gray-400">See subtasks, descriptions, and task structure</p>
              </div>
              <div className="space-y-2">
                <div className="bg-slate-800/30 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-[#01BBFF]" />
                    <span className="text-sm text-white">Research competitors</span>
                  </div>
                </div>
                <div className="bg-slate-800/30 rounded-lg p-3 border border-white/5">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-gray-400 rounded-full" />
                    <span className="text-sm text-white">Create presentation</span>
                  </div>
                </div>
              </div>
            </div>
          </FeatureCard>

          {/* Organize Tasks */}
          <FeatureCard className="lg:col-span-1">
            <div className="p-6 h-full min-h-[200px]">
              <div className="mb-4">
                <h3 className="text-lg font-bold text-white mb-1">Organize Your Tasks</h3>
                <p className="text-sm text-gray-400">Sort tasks by priority, labels, and projects</p>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#01BBFF] rounded-full" />
                  <span className="text-sm text-white">High Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#01BBFF]/60 rounded-full" />
                  <span className="text-sm text-white">Medium Priority</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 bg-[#01BBFF]/30 rounded-full" />
                  <span className="text-sm text-white">Low Priority</span>
                </div>
              </div>
            </div>
          </FeatureCard>
        </div>
      </div>
      
      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255, 255, 255, 0.1);
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #01BBFF;
          border-radius: 2px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #0199CC;
        }
      `}</style>
    </div>
  );
}