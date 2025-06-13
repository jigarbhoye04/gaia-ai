"use client";

import { format } from "date-fns";
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";

interface GoalNode {
  id: string;
  data: {
    title?: string;
    label?: string;
    isComplete?: boolean;
    type?: string;
    subtask_id?: string;
  };
}

interface GoalRoadmap {
  nodes: GoalNode[];
  edges: Array<{
    id: string;
    source: string;
    target: string;
  }>;
}

interface Goal {
  id: string;
  title: string;
  description?: string;
  progress?: number;
  roadmap?: GoalRoadmap;
  created_at?: string;
  todo_project_id?: string;
  todo_id?: string;
}

interface GoalStats {
  total_goals: number;
  goals_with_roadmaps: number;
  total_tasks: number;
  completed_tasks: number;
  overall_completion_rate: number;
  active_goals: Array<{
    id: string;
    title: string;
    progress: number;
  }>;
  active_goals_count: number;
}

export type GoalAction =
  | "create"
  | "list"
  | "get"
  | "delete"
  | "search"
  | "stats"
  | "creating"
  | "fetching"
  | "deleting"
  | "updating_progress"
  | "generating_roadmap"
  | "roadmap_generated"
  | "roadmap_needed"
  | "node_updated"
  | "error";

interface GoalSectionProps {
  goals?: Goal[];
  stats?: GoalStats;
  action?: GoalAction;
  message?: string;
  goal_id?: string;
  deleted_goal_id?: string;
  error?: string;
}

export default function GoalSection({
  goals,
  stats,
  action = "list",
  message,
  goal_id,
  deleted_goal_id: _deleted_goal_id,
  error,
}: GoalSectionProps) {
  const router = useRouter();
  const [expandedGoals, setExpandedGoals] = useState<Set<string>>(new Set());

  const toggleGoalExpansion = (goalId: string) => {
    const newExpanded = new Set(expandedGoals);
    if (newExpanded.has(goalId)) {
      newExpanded.delete(goalId);
    } else {
      newExpanded.add(goalId);
    }
    setExpandedGoals(newExpanded);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, "MMM d, yyyy");
  };

  const getProgressColor = (progress: number) => {
    if (progress >= 90) return "text-green-500";
    if (progress >= 75) return "text-blue-500";
    if (progress >= 50) return "text-yellow-500";
    if (progress >= 25) return "text-orange-500";
    return "text-red-500";
  };

  const getProgressBgColor = (progress: number) => {
    if (progress >= 90) return "bg-green-500/10";
    if (progress >= 75) return "bg-blue-500/10";
    if (progress >= 50) return "bg-yellow-500/10";
    if (progress >= 25) return "bg-orange-500/10";
    return "bg-red-500/10";
  };

  // Error State
  if (error) {
    return (
      <div className="mt-3 w-fit min-w-[300px] rounded-2xl rounded-bl-none bg-zinc-800 p-4">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="h-4 w-4 text-red-500" />
          <p className="text-sm text-red-400">{error}</p>
        </div>
      </div>
    );
  }

  // Statistics View
  if (action === "stats" && stats) {
    return (
      <div className="mt-3 w-fit min-w-[400px] rounded-2xl rounded-bl-none bg-zinc-800 p-4">
        <div className="mb-3 flex items-center gap-2 text-sm">
          <BarChart3 className="h-4 w-4 text-purple-500" />
          Goal Progress Overview
        </div>
        <div className="grid grid-cols-3 gap-2">
          <div className="rounded-xl bg-zinc-900 p-3 text-center">
            <p className="text-xl font-semibold text-zinc-100">
              {stats.total_goals}
            </p>
            <p className="text-xs text-zinc-500">Total Goals</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 text-center">
            <p className="text-xl font-semibold text-purple-500">
              {stats.goals_with_roadmaps}
            </p>
            <p className="text-xs text-zinc-500">With Roadmaps</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 text-center">
            <p className="text-xl font-semibold text-green-500">
              {stats.overall_completion_rate}%
            </p>
            <p className="text-xs text-zinc-500">Complete</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 text-center">
            <p className="text-xl font-semibold text-blue-500">
              {stats.total_tasks}
            </p>
            <p className="text-xs text-zinc-500">Total Tasks</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 text-center">
            <p className="text-xl font-semibold text-green-500">
              {stats.completed_tasks}
            </p>
            <p className="text-xs text-zinc-500">Done Tasks</p>
          </div>
          <div className="rounded-xl bg-zinc-900 p-3 text-center">
            <p className="text-xl font-semibold text-orange-500">
              {stats.active_goals_count}
            </p>
            <p className="text-xs text-zinc-500">Active</p>
          </div>
        </div>

        {stats.active_goals && stats.active_goals.length > 0 && (
          <div className="mt-4">
            <p className="mb-2 text-xs font-medium text-zinc-500">
              Top Active Goals
            </p>
            <div className="space-y-2">
              {stats.active_goals.map((goal) => (
                <div
                  key={goal.id}
                  className="flex cursor-pointer items-center justify-between rounded-xl bg-zinc-900 p-3 hover:bg-zinc-900/80"
                  onClick={() => router.push(`/goals/${goal.id}`)}
                >
                  <div className="flex items-center gap-3">
                    <Target className="h-4 w-4 text-purple-500" />
                    <span className="text-sm font-medium text-zinc-100">
                      {goal.title}
                    </span>
                  </div>
                  <div
                    className={`text-xs font-medium ${getProgressColor(goal.progress)}`}
                  >
                    {goal.progress}%
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Progress/Loading Messages
  if (
    [
      "creating",
      "fetching",
      "deleting",
      "updating_progress",
      "generating_roadmap",
    ].includes(action)
  ) {
    const icons = {
      creating: <Zap className="h-4 w-4 text-blue-500" />,
      fetching: <Clock className="h-4 w-4 text-blue-500" />,
      deleting: <Clock className="h-4 w-4 text-red-500" />,
      updating_progress: <TrendingUp className="h-4 w-4 text-green-500" />,
      generating_roadmap: <Users className="h-4 w-4 text-purple-500" />,
    };

    return (
      <div className="mt-3 w-fit rounded-2xl rounded-bl-none bg-zinc-800 p-4">
        <div className="flex items-center gap-2">
          {icons[action as keyof typeof icons] || (
            <Clock className="h-4 w-4 text-blue-500" />
          )}
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  }

  // Roadmap needed message
  if (action === "roadmap_needed" && message) {
    return (
      <div className="mt-3 w-fit min-w-[350px] rounded-2xl rounded-bl-none bg-zinc-800 p-4">
        <div className="mb-3 flex items-center gap-2">
          <Users className="h-4 w-4 text-purple-500" />
          <p className="text-sm text-zinc-300">{message}</p>
        </div>
        <button
          onClick={() => router.push(`/goals/${goal_id}`)}
          className="w-full rounded-lg bg-purple-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-purple-700"
        >
          Generate Roadmap
        </button>
      </div>
    );
  }

  // Goals List View
  if (goals && goals.length > 0) {
    return (
      <div className="mt-3 w-fit min-w-[450px] rounded-2xl rounded-bl-none bg-zinc-800 p-4">
        <div className="mb-3 flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm">
            <Target className="h-4 w-4 text-purple-500" />
            {action === "search"
              ? "Search Results"
              : action === "create"
                ? "New Goal"
                : action === "roadmap_generated"
                  ? "Goal with Roadmap"
                  : action === "node_updated"
                    ? "Updated Progress"
                    : "Your Goals"}
          </div>
          <span className="text-xs text-zinc-500">
            {goals.length} {goals.length === 1 ? "goal" : "goals"}
          </span>
        </div>
        <div className="space-y-3">
          {goals.map((goal) => {
            const isExpanded = expandedGoals.has(goal.id);
            const hasRoadmap =
              goal.roadmap?.nodes && goal.roadmap.nodes.length > 0;
            const roadmapTasks = hasRoadmap
              ? goal.roadmap!.nodes.filter(
                  (node) =>
                    node.data.type !== "start" && node.data.type !== "end",
                )
              : [];
            const completedTasks = roadmapTasks.filter(
              (node) => node.data.isComplete,
            );
            const progress =
              roadmapTasks.length > 0
                ? Math.round(
                    (completedTasks.length / roadmapTasks.length) * 100,
                  )
                : goal.progress || 0;

            return (
              <div key={goal.id} className="rounded-xl bg-zinc-900 p-4">
                {/* Goal Header */}
                <div className="flex items-start gap-3">
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1">
                        <h4 className="mb-2 text-sm font-medium text-zinc-100">
                          {goal.title}
                        </h4>

                        {/* Progress Bar */}
                        <div className="mb-3">
                          <div className="mb-1 flex items-center justify-between text-xs">
                            <span className="text-zinc-400">Progress</span>
                            <span
                              className={`font-medium ${getProgressColor(progress)}`}
                            >
                              {progress}%
                            </span>
                          </div>
                          <div className="h-2 w-full rounded-full bg-zinc-700">
                            <div
                              className={`h-2 rounded-full transition-all duration-300 ${
                                progress >= 90
                                  ? "bg-green-500"
                                  : progress >= 75
                                    ? "bg-blue-500"
                                    : progress >= 50
                                      ? "bg-yellow-500"
                                      : progress >= 25
                                        ? "bg-orange-500"
                                        : "bg-red-500"
                              }`}
                              style={{ width: `${progress}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      {(goal.description || hasRoadmap) && (
                        <button
                          onClick={() => toggleGoalExpansion(goal.id)}
                          className="rounded p-1 hover:bg-zinc-700"
                        >
                          <ChevronRight
                            className={`h-4 w-4 text-zinc-500 transition-transform ${
                              isExpanded ? "rotate-90" : ""
                            }`}
                          />
                        </button>
                      )}
                    </div>

                    {/* Goal Metadata */}
                    <div className="flex flex-wrap items-center gap-2 text-xs">
                      {hasRoadmap && (
                        <span
                          className={`flex items-center gap-1 rounded-full px-2 py-0.5 text-xs ${getProgressBgColor(progress)} ${getProgressColor(progress)}`}
                        >
                          <Users className="h-3 w-3" />
                          {completedTasks.length}/{roadmapTasks.length} tasks
                        </span>
                      )}

                      {goal.created_at && (
                        <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          <Calendar className="h-3 w-3" />
                          {formatDate(goal.created_at)}
                        </span>
                      )}

                      {goal.todo_project_id && (
                        <span className="flex items-center gap-1 rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                          <Trophy className="h-3 w-3" />
                          Linked to Todos
                        </span>
                      )}
                    </div>

                    {/* Expanded Content */}
                    {isExpanded && (
                      <div className="mt-3 space-y-3">
                        {goal.description && (
                          <div>
                            <p className="mb-1 text-xs font-medium text-zinc-500">
                              Description
                            </p>
                            <p className="text-sm text-zinc-400">
                              {goal.description}
                            </p>
                          </div>
                        )}

                        {hasRoadmap && roadmapTasks.length > 0 && (
                          <div className="space-y-2">
                            <p className="text-xs font-medium text-zinc-500">
                              Roadmap Tasks
                            </p>
                            <div className="space-y-1">
                              {roadmapTasks.map((node) => (
                                <div
                                  key={node.id}
                                  className="flex items-center gap-2 pl-2"
                                >
                                  <div
                                    className={`flex h-4 w-4 items-center justify-center rounded-full border-2 ${
                                      node.data.isComplete
                                        ? "border-success bg-success"
                                        : "border-zinc-600"
                                    }`}
                                  >
                                    {node.data.isComplete && (
                                      <CheckCircle2 className="h-2.5 w-2.5 text-white" />
                                    )}
                                  </div>
                                  <span
                                    className={`text-xs ${
                                      node.data.isComplete
                                        ? "text-zinc-500 line-through"
                                        : "text-zinc-300"
                                    }`}
                                  >
                                    {node.data.title ||
                                      node.data.label ||
                                      "Untitled Task"}
                                  </span>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        <div className="flex gap-2 pt-2">
                          <button
                            onClick={() => router.push(`/goals/${goal.id}`)}
                            className="flex-1 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-purple-700"
                          >
                            View Goal
                          </button>
                          {hasRoadmap && goal.todo_project_id && (
                            <button
                              onClick={() =>
                                router.push(
                                  `/todos/project/${goal.todo_project_id}`,
                                )
                              }
                              className="flex-1 rounded-lg bg-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 transition-colors hover:bg-zinc-600"
                            >
                              View Tasks
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {message && <p className="mt-3 text-xs text-zinc-500">{message}</p>}
      </div>
    );
  }

  // Empty State
  if (action === "list" && (!goals || goals.length === 0)) {
    return (
      <div className="mt-3 w-fit min-w-[300px] rounded-2xl rounded-bl-none bg-zinc-800 p-6 text-center">
        <Target className="mx-auto h-8 w-8 text-zinc-600" />
        <p className="mt-2 text-sm text-zinc-300">No goals found</p>
        {message && <p className="mt-1 text-xs text-zinc-500">{message}</p>}
      </div>
    );
  }

  // Success/Action Message
  if (message && !goals && !stats) {
    const isDeleteAction = action === "delete";
    const isSuccessAction = [
      "create",
      "roadmap_generated",
      "node_updated",
    ].includes(action);
    const iconColor = isDeleteAction
      ? "text-red-500"
      : isSuccessAction
        ? "text-green-500"
        : "text-blue-500";
    const icon = isDeleteAction
      ? CheckCircle2
      : isSuccessAction
        ? CheckCircle2
        : Target;
    const IconComponent = icon;

    return (
      <div className="mt-3 w-fit rounded-2xl rounded-bl-none bg-zinc-800 p-4">
        <div className="flex items-center gap-2">
          <IconComponent className={`h-4 w-4 ${iconColor}`} />
          <p className="text-sm">{message}</p>
        </div>
      </div>
    );
  }

  return null;
}
