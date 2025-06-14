"use client";

import { Folder } from "lucide-react";

import { DropdownMenuItem } from "@/components/ui/shadcn/dropdown-menu";
import { Project } from "@/types/features/todoTypes";

import BaseFieldChip from "./BaseFieldChip";

interface ProjectFieldChipProps {
  value?: string;
  projects: Project[];
  onChange: (projectId: string) => void;
  className?: string;
}

export default function ProjectFieldChip({
  value,
  projects,
  onChange,
  className,
}: ProjectFieldChipProps) {
  const selectedProject = projects.find((project) => project.id === value);
  const displayValue = selectedProject?.name;

  // Create a custom display value with project color indicator
  const displayValueWithColor = selectedProject ? (
    <div className="flex items-center gap-2">
      <div
        className="h-3 w-3 flex-shrink-0 rounded-full border-0"
        style={{ backgroundColor: selectedProject.color || "#71717a" }}
      />
      <span className="truncate text-zinc-200">{selectedProject.name}</span>
    </div>
  ) : undefined;

  return (
    <BaseFieldChip
      label="Project"
      value={displayValueWithColor || displayValue}
      placeholder="Project"
      icon={!selectedProject ? <Folder size={14} /> : undefined}
      variant={selectedProject ? "primary" : "default"}
      className={className}
    >
      {projects.map((project) => (
        <DropdownMenuItem
          key={project.id}
          onClick={() => onChange(project.id)}
          className="cursor-pointer gap-2 border-0 text-zinc-300 outline-none hover:bg-zinc-800 focus:outline-none"
        >
          <div
            className="h-3 w-3 flex-shrink-0 rounded-full border-0"
            style={{ backgroundColor: project.color || "#71717a" }}
          />
          <span className="truncate">{project.name}</span>
        </DropdownMenuItem>
      ))}
    </BaseFieldChip>
  );
}
