"use client";

import { Priority, Project } from "@/types/features/todoTypes";

import {
  DateFieldChip,
  LabelsFieldChip,
  PriorityFieldChip,
  ProjectFieldChip,
} from "../fields";

interface TodoFieldsRowProps {
  priority: Priority;
  projectId?: string;
  projects: Project[];
  dueDate?: string;
  dueDateTimezone?: string;
  labels: string[];
  onPriorityChange: (priority: Priority) => void;
  onProjectChange: (projectId: string) => void;
  onDateChange: (date?: string, timezone?: string) => void;
  onLabelsChange: (labels: string[]) => void;
  className?: string;
}

export default function TodoFieldsRow({
  priority,
  projectId,
  projects,
  dueDate,
  dueDateTimezone: _dueDateTimezone,
  labels,
  onPriorityChange,
  onProjectChange,
  onDateChange,
  onLabelsChange,
  className,
}: TodoFieldsRowProps) {
  return (
    <div className={`flex flex-wrap gap-2 ${className || ""}`}>
      <ProjectFieldChip
        value={projectId}
        projects={projects}
        onChange={onProjectChange}
      />
      <PriorityFieldChip value={priority} onChange={onPriorityChange} />
      <DateFieldChip value={dueDate} onChange={onDateChange} />
      <LabelsFieldChip value={labels} onChange={onLabelsChange} />
    </div>
  );
}
