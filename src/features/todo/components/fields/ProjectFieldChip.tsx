"use client";

import { DropdownItem } from "@heroui/dropdown";
import { Folder } from "lucide-react";

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

  return (
    <BaseFieldChip
      label="Project"
      value={displayValue}
      placeholder="Project"
      icon={<Folder size={14} />}
      variant="secondary"
      className={className}
    >
      {projects.map((project) => (
        <DropdownItem
          key={project.id}
          onPress={() => onChange(project.id)}
          className="gap-2"
          startContent={
            <div
              className="h-3 w-3 rounded-full"
              style={{ backgroundColor: project.color || "#6b7280" }}
            />
          }
        >
          {project.name}
        </DropdownItem>
      ))}
    </BaseFieldChip>
  );
}
