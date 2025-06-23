import { FeatureCard } from "../../shared/FeatureCard";
import LargeHeader from "../../shared/LargeHeader";

interface TodoTool {
  title: string;
  description: string;
}

const todoTools: TodoTool[] = [
  {
    title: "Smart Task Creation",
    description: "Add tasks and subtasks using natural language",
  },
  {
    title: "Organize & Prioritize",
    description: "Sort tasks by projects, labels, due dates, or priority",
  },
  {
    title: "Quick Updates",
    description: "Edit, move, or delete tasks with simple commands",
  },
  {
    title: "Powerful Search",
    description: "Find tasks using keywords or semantic search",
  },
  {
    title: "Task Statistics",
    description: "View progress and productivity stats",
  },
  {
    title: "Project Management",
    description: "Group tasks under color-coded projects",
  },
  {
    title: "Subtasks",
    description: "Break big tasks into smaller steps",
  },
  {
    title: "Labels & Tags",
    description: "Categorize tasks with custom labels",
  },
  {
    title: "Bulk Actions",
    description: "Complete, move, or delete multiple tasks at once",
  },
  {
    title: "Priority Levels",
    description: "Focus using task priority settings",
  },
];

export default function Todo() {
  return (
    <div className="flex flex-col items-center justify-center gap-10 p-10">
      <LargeHeader
        chipText="To-do lists"
        headingText="Save Hours on Task Management"
        subHeadingText={
          "Stop wasting time organizing your to-dos — GAIA manages   everything for you through simple text."
        }
      />
      <div className="grid h-full w-full max-w-6xl grid-cols-4 grid-rows-2 gap-5">
        <div className="col-span-2">
          <FeatureCard
            imageSrc="/landing/todo/3.png"
            title="Easily Manage Tasks Through Chat"
            description="Type messages to create and manage your tasks"
          />
        </div>

        <div className="col-span-2">
          <FeatureCard
            title={`${todoTools.length}+ Todo Tools`}
            description="Stop wasting time organising to-do lists — GAIA turns your words into action instantly"
          >
            <div className="mt-8 grid grid-cols-2 gap-3">
              {todoTools.map((tool, index) => (
                <div key={index} className="rounded-xl bg-zinc-800 p-3">
                  <div className="text-sm font-medium text-zinc-300">
                    {tool.title}
                  </div>
                  <div className="text-xs text-zinc-400">
                    {tool.description}
                  </div>
                </div>
              ))}
            </div>
          </FeatureCard>
        </div>

        <div className="col-span-2">
          <FeatureCard
            imageSrc="/landing/todo/1.png"
            title="Easy Task Creation"
            description="Create tasks using everyday language"
          />
        </div>
        <FeatureCard
          imageSrc="/landing/todo/4.png"
          title="View Task Details"
          description="See subtasks, descriptions, and task structure"
          small
        />

        <FeatureCard
          imageSrc="/landing/todo/2.png"
          title="Organize Your Tasks"
          description="Sort tasks by priority, labels, and projects"
          small
        />
      </div>
    </div>
  );
}
