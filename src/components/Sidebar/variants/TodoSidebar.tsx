"use client";

import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Input } from "@heroui/input";
import {
  Calendar,
  CalendarDays,
  CheckCircle2,
  Folder,
  Plus,
} from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { InboxIcon, SearchIcon } from "@/components/Misc/icons";
import AddProjectModal from "@/components/Todo/AddProjectModal";
import AddTodoModal from "@/components/Todo/AddTodoModal";
import { TodoService } from "@/services/todoService";
import { Priority, Project } from "@/types/todoTypes";

type MenuItem = {
  label: string;
  icon: React.ElementType;
  href: string;
  count?: number;
};

type SidebarSectionProps = {
  title?: string;
  items: MenuItem[];
  activeItem: string;
  onItemClick: (href: string) => void;
};

function SidebarSection({
  title,
  items,
  activeItem,
  onItemClick,
}: SidebarSectionProps) {
  return (
    <div className="mb-4">
      {title && (
        <div className="px-2 pb-1 text-sm font-medium text-foreground-500">
          {title}
        </div>
      )}
      {items.map((item) => (
        <Button
          key={item.href}
          startContent={<item.icon className="mr-1" />}
          endContent={
            item.count !== undefined && (
              <span className="ml-auto text-xs text-foreground-500">
                {item.count}
              </span>
            )
          }
          className={`justify-start pl-2 text-start ${
            activeItem === item.href
              ? "bg-primary/10 text-primary"
              : "text-foreground-600"
          }`}
          variant="light"
          radius="sm"
          onPress={() => onItemClick(item.href)}
        >
          {item.label}
        </Button>
      ))}
    </div>
  );
}

// Priority colors mapping
const priorityColors: Record<Priority, string> = {
  [Priority.HIGH]: "#ef4444", // red
  [Priority.MEDIUM]: "#eab308", // yellow
  [Priority.LOW]: "#3b82f6", // blue
  [Priority.NONE]: "#6b7280", // gray
};

export default function TodoSidebar() {
  const router = useRouter();
  const pathname = usePathname();
  const [addTodoOpen, setAddTodoOpen] = useState(false);
  const [addProjectOpen, setAddProjectOpen] = useState(false);
  const [projects, setProjects] = useState<Project[]>([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [todoCounts, setTodoCounts] = useState({
    inbox: 0,
    today: 0,
    upcoming: 0,
    completed: 0,
  });

  // Load projects
  useEffect(() => {
    loadProjects();
    loadTodoCounts();
  }, []);

  const loadProjects = async () => {
    try {
      const projectList = await TodoService.getAllProjects();
      setProjects(projectList);
    } catch (error) {
      console.error("Failed to load projects:", error);
    }
  };

  const loadTodoCounts = async () => {
    try {
      // This would ideally come from stats API or be calculated
      const stats = await TodoService.getTodoStats();
      setTodoCounts({
        inbox: stats.by_project.inbox || 0,
        today: 0, // Would need today count from API
        upcoming: 0, // Would need upcoming count from API
        completed: stats.completed,
      });
    } catch (error) {
      console.error("Failed to load todo counts:", error);
    }
  };

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/todos/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const mainMenuItems: MenuItem[] = [
    {
      label: "Inbox",
      icon: InboxIcon,
      href: "/todos",
      count: todoCounts.inbox,
    },
    {
      label: "Today",
      icon: CalendarDays,
      href: "/todos/today",
      count: todoCounts.today,
    },
    {
      label: "Upcoming",
      icon: Calendar,
      href: "/todos/upcoming",
      count: todoCounts.upcoming,
    },
    {
      label: "Completed",
      icon: CheckCircle2,
      href: "/todos/completed",
      count: todoCounts.completed,
    },
  ];

  // Convert projects to menu items
  const projectMenuItems: MenuItem[] = projects
    .filter((p) => !p.is_default)
    .map((project) => ({
      label: project.name,
      icon: Folder,
      href: `/todos/project/${project.id}`,
      count: project.todo_count,
    }));

  // Priority/label items
  const labelMenuItems: MenuItem[] = [
    {
      label: "High Priority",
      icon: () => (
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: priorityColors[Priority.HIGH] }}
        />
      ),
      href: "/todos/priority/high",
    },
    {
      label: "Medium Priority",
      icon: () => (
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: priorityColors[Priority.MEDIUM] }}
        />
      ),
      href: "/todos/priority/medium",
    },
    {
      label: "Low Priority",
      icon: () => (
        <div
          className="h-3 w-3 rounded-full"
          style={{ backgroundColor: priorityColors[Priority.LOW] }}
        />
      ),
      href: "/todos/priority/low",
    },
  ];

  return (
    <>
      <div className="flex h-full flex-col">
        {/* Add Task Button */}
        <div className="mb-5 w-full">
          <Button
            className="w-full justify-start text-sm text-primary"
            color="primary"
            size="sm"
            variant="flat"
            startContent={<Plus className="h-4 w-4" />}
            onPress={() => setAddTodoOpen(true)}
          >
            Add Task
          </Button>
        </div>

        {/* Search */}
        <form onSubmit={handleSearch} className="mb-4 px-2">
          <Input
            placeholder="Search tasks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            startContent={
              <SearchIcon className="h-4 w-4 text-foreground-400" />
            }
            size="sm"
            radius="sm"
            classNames={{
              input: "text-xs",
              inputWrapper: "h-8",
            }}
          />
        </form>

        {/* Main Menu */}
        <SidebarSection
          items={mainMenuItems}
          activeItem={pathname}
          onItemClick={handleNavigation}
        />

        <Divider className="my-2" />

        {/* Labels */}
        <SidebarSection
          title="LABELS"
          items={labelMenuItems}
          activeItem={pathname}
          onItemClick={handleNavigation}
        />

        <Divider className="my-2" />

        {/* Projects */}
        <div className="flex items-center justify-between px-2 pb-1">
          <span className="text-sm font-medium text-foreground-500">
            PROJECTS
          </span>
          <Button
            isIconOnly
            size="sm"
            variant="light"
            onPress={() => setAddProjectOpen(true)}
            className="h-6 w-6 min-w-6"
          >
            <Plus className="h-3 w-3" />
          </Button>
        </div>
        <SidebarSection
          items={projectMenuItems}
          activeItem={pathname}
          onItemClick={handleNavigation}
        />
      </div>

      {/* Modals */}
      <AddTodoModal
        open={addTodoOpen}
        onOpenChange={setAddTodoOpen}
        onSuccess={() => {
          loadProjects();
          loadTodoCounts();
        }}
      />
      <AddProjectModal
        open={addProjectOpen}
        onOpenChange={setAddProjectOpen}
        onSuccess={loadProjects}
      />
    </>
  );
}
