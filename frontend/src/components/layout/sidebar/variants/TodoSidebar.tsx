"use client";

import { Button } from "@heroui/button";
import { Divider } from "@heroui/divider";
import { Plus, Tag } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import {
  Appointment01Icon,
  Calendar01Icon,
  Calendar03Icon,
  CalendarCheckOut02Icon,
  Folder02Icon,
  LabelImportantIcon,
} from "@/components/shared/icons";
import Spinner from "@/components/ui/shadcn/spinner";
import AddProjectModal from "@/features/todo/components/AddProjectModal";
import TodoModal from "@/features/todo/components/TodoModal";
import { useTodos } from "@/features/todo/hooks/useTodos";
import { RootState } from "@/redux/store";
import { Priority } from "@/types/features/todoTypes";

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
        <div className="px-2 pb-1 text-xs font-medium text-foreground-500">
          {title}
        </div>
      )}
      {items.map((item) => (
        <Button
          key={item.href}
          fullWidth
          startContent={<item.icon className="w-[20px] text-foreground-500" />}
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
          size="sm"
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
  // const [searchQuery, setSearchQuery] = useState("");

  const {
    projects,
    labels,
    counts,
    loading,
    loadProjects,
    loadLabels,
    loadCounts,
    refreshAllData,
  } = useTodos();
  const todoState = useSelector((state: RootState) => state.todos);

  // Check if initial data has been loaded (labels are optional)
  const isInitialDataLoaded =
    todoState.initialDataLoaded.projects &&
    todoState.initialDataLoaded.counts;

  // Load initial data
  useEffect(() => {
    const loadData = async () => {
      // Load core data first (projects and counts are most important)
      await Promise.all([loadProjects(), loadCounts()]);
    };

    if (!isInitialDataLoaded) {
      loadData();
    }
  }, [loadProjects, loadCounts, isInitialDataLoaded]);

  // Load labels lazily when they are actually needed (only once)
  useEffect(() => {
    if (!todoState.initialDataLoaded.labels && isInitialDataLoaded) {
      // Only load labels if we don't have them yet and core data is loaded
      loadLabels();
    }
  }, [isInitialDataLoaded, todoState.initialDataLoaded.labels, loadLabels]);

  // Only refresh counts on navigation if they are stale (more than 2 minutes old)
  useEffect(() => {
    if (isInitialDataLoaded) {
      const now = Date.now();
      const countsFreshTime = 2 * 60 * 1000; // 2 minutes
      const isCountsStale = now - todoState.lastFetch.counts > countsFreshTime;

      if (isCountsStale) {
        loadCounts();
      }
    }
  }, [pathname, loadCounts, isInitialDataLoaded, todoState.lastFetch.counts]);

  const handleNavigation = (href: string) => {
    router.push(href);
  };

  // const handleSearch = (e: React.FormEvent) => {
  //   e.preventDefault();
  //   if (searchQuery.trim()) {
  //     router.push(`/todos/search?q=${encodeURIComponent(searchQuery)}`);
  //   }
  // };

  const mainMenuItems: MenuItem[] = [
    {
      label: "Inbox",
      icon: Calendar03Icon,
      href: "/todos",
      count: counts.inbox,
    },
    {
      label: "Today",
      icon: Calendar01Icon,
      href: "/todos/today",
      count: counts.today,
    },
    {
      label: "Upcoming",
      icon: CalendarCheckOut02Icon,
      href: "/todos/upcoming",
      count: counts.upcoming,
    },
    {
      label: "Completed",
      icon: Appointment01Icon,
      href: "/todos/completed",
      count: counts.completed,
    },
  ];

  // Priority items
  const priorityMenuItems: MenuItem[] = [
    {
      label: "High Priority",
      icon: () => (
        <LabelImportantIcon width={19} color={priorityColors[Priority.HIGH]} />
      ),
      href: "/todos/priority/high",
    },
    {
      label: "Medium Priority",
      icon: () => (
        <LabelImportantIcon
          width={19}
          color={priorityColors[Priority.MEDIUM]}
        />
      ),
      href: "/todos/priority/medium",
    },
    {
      label: "Low Priority",
      icon: () => (
        <LabelImportantIcon width={19} color={priorityColors[Priority.LOW]} />
      ),
      href: "/todos/priority/low",
    },
  ];

  // Label items - show top 5 most used labels or empty state
  const labelMenuItems: MenuItem[] =
    labels.length > 0
      ? labels.slice(0, 5).map((label) => ({
          label: label.name,
          icon: () => <Tag className="w-[20px]" strokeWidth={1.5} />,
          href: `/todos/label/${encodeURIComponent(label.name)}`,
          count: label.count,
        }))
      : [];

  // Project color component
  const ProjectIcon = ({ color }: { color?: string }) => {
    return (
      <div className="flex items-center">
        <Folder02Icon className="w-[20px]" style={{ color }} />
      </div>
    );
  };

  // Project items - convert projects to menu items or empty state
  const projectMenuItems: MenuItem[] = projects
    .filter((p) => !p.is_default)
    .map((project) => ({
      label: project.name,
      icon: () => <ProjectIcon color={project.color} />,
      href: `/todos/project/${project.id}`,
      count: project.todo_count,
    }));

  return (
    <>
      <div className="flex flex-col space-y-3">
        {/* Add Task Button */}
        <div className="w-full">
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

        {/* TODO: fix implementation on backend then integrate. */}
        {/* <form onSubmit={handleSearch} className="mb-4">
          <Input
            placeholder="search tasks..."
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
        </form> */}

        {!isInitialDataLoaded ? (
          <div className="flex h-[400px] w-full items-center justify-center">
            <Spinner />
          </div>
        ) : (
          <>
            {/* Main Menu */}
            <SidebarSection
              items={mainMenuItems}
              activeItem={pathname}
              onItemClick={handleNavigation}
            />

            <Divider className="my-2" />

            {/* Priorities */}
            <SidebarSection
              title="Priorities"
              items={priorityMenuItems}
              activeItem={pathname}
              onItemClick={handleNavigation}
            />

            <Divider className="my-2" />

            {/* Labels */}
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-xs font-medium text-foreground-400">
                  Labels
                </span>
              </div>
              {labelMenuItems.length > 0 ? (
                labelMenuItems.map((item) => (
                  <Button
                    key={item.href}
                    fullWidth
                    startContent={<item.icon className="w-[20px]" />}
                    endContent={
                      item.count !== undefined && (
                        <span className="ml-auto text-xs text-foreground-400">
                          {item.count}
                        </span>
                      )
                    }
                    className={`justify-start pl-2 text-start ${
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-foreground-600"
                    }`}
                    variant="light"
                    radius="sm"
                    size="sm"
                    onPress={() => handleNavigation(item.href)}
                  >
                    {item.label}
                  </Button>
                ))
              ) : loading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : (
                <div className="px-2 py-4 text-center text-xs text-foreground-400 italic">
                  No labels yet
                </div>
              )}
            </div>

            <Divider className="my-2" />

            {/* Projects */}
            <div className="mb-4">
              <div className="flex items-center justify-between px-2 pb-1">
                <span className="text-xs font-medium text-foreground-400">
                  Projects
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
              {projectMenuItems.length > 0 ? (
                projectMenuItems.map((item) => (
                  <Button
                    key={item.href}
                    fullWidth
                    startContent={<item.icon />}
                    endContent={
                      item.count !== undefined && (
                        <span className="ml-auto text-xs text-foreground-500">
                          {item.count}
                        </span>
                      )
                    }
                    className={`justify-start pl-2 text-start ${
                      pathname === item.href
                        ? "bg-primary/10 text-primary"
                        : "text-foreground-600"
                    }`}
                    variant="light"
                    radius="sm"
                    size="sm"
                    onPress={() => handleNavigation(item.href)}
                  >
                    {item.label}
                  </Button>
                ))
              ) : loading ? (
                <div className="flex justify-center py-4">
                  <Spinner />
                </div>
              ) : (
                <div className="px-2 py-4 text-center text-xs text-foreground-400 italic">
                  No projects yet
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Modals */}
      <TodoModal
        mode="add"
        open={addTodoOpen}
        onOpenChange={setAddTodoOpen}
        onSuccess={() => {
          // Refresh counts and projects only
          loadCounts();
          loadProjects();
        }}
      />
      <AddProjectModal
        open={addProjectOpen}
        onOpenChange={setAddProjectOpen}
        onSuccess={() => {
          // Refresh counts and projects only
          loadCounts();
          loadProjects();
        }}
      />
    </>
  );
}
