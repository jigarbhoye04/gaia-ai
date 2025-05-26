"use client";

import { Button } from "@heroui/button";
import { Card, CardBody } from "@heroui/card";
import { Checkbox } from "@heroui/checkbox";
import { Chip } from "@heroui/chip";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { format } from "date-fns";
import {
  ChevronDown,
  ChevronRight,
  Edit2,
  MoreVertical,
  Plus,
  Trash2,
} from "lucide-react";
import { useState } from "react";

import { CalendarIcon } from "@/components/Misc/icons";
import { TodoService } from "@/services/todoService";
import { Priority, Todo, TodoUpdate } from "@/types/todoTypes";

import EditTodoModal from "./EditTodoModal";

interface TodoItemProps {
  todo: Todo;
  isSelected: boolean;
  onUpdate: (todoId: string, updates: TodoUpdate) => void;
  onDelete: (todoId: string) => void;
  onClick?: (todo: Todo) => void;
}

const priorityColors = {
  [Priority.HIGH]: "danger",
  [Priority.MEDIUM]: "warning",
  [Priority.LOW]: "primary",
  [Priority.NONE]: "default",
} as const;

export default function TodoItem({
  todo,
  isSelected,
  onUpdate,
  onDelete,
  onClick,
}: TodoItemProps) {
  const [editOpen, setEditOpen] = useState(false);
  const [showSubtasks, setShowSubtasks] = useState(false);
  const [addingSubtask, setAddingSubtask] = useState(false);
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("");

  const handleToggleComplete = () => {
    onUpdate(todo.id, { completed: !todo.completed });
  };

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return;

    try {
      const updatedTodo = await TodoService.addSubtask(todo.id, {
        title: newSubtaskTitle.trim(),
      });
      onUpdate(todo.id, updatedTodo);
      setNewSubtaskTitle("");
      setAddingSubtask(false);
    } catch (error) {
      console.error("Failed to add subtask:", error);
    }
  };

  const isOverdue =
    todo.due_date && new Date(todo.due_date) < new Date() && !todo.completed;

  return (
    <>
      <Card
        className={`w-full cursor-pointer transition-all ${
          isSelected
            ? "bg-primary/5 ring-2 ring-primary"
            : "hover:bg-default-50"
        } ${todo.completed ? "opacity-60" : ""}`}
        isPressable
        shadow="sm"
        onPress={() => onClick?.(todo)}
      >
        <CardBody className="p-3">
          <div className="flex items-start gap-3">
            {/* Complete Checkbox */}
            <Checkbox
              isSelected={todo.completed}
              onChange={handleToggleComplete}
              size="sm"
              className="mt-1"
              color="success"
            />

            {/* Main Content */}
            <div className="min-w-0 flex-1">
              {/* Title and Description */}
              <div className="mb-2">
                <h4
                  className={`text-sm font-medium ${
                    todo.completed ? "text-foreground-500 line-through" : ""
                  }`}
                >
                  {todo.title}
                </h4>
                {todo.description && (
                  <p className="mt-1 text-xs text-foreground-500">
                    {todo.description}
                  </p>
                )}
              </div>

              {/* Metadata Row */}
              <div className="flex flex-wrap items-center gap-2">
                {/* Priority */}
                {todo.priority !== Priority.NONE && (
                  <Chip
                    size="sm"
                    variant="flat"
                    color={priorityColors[todo.priority]}
                  >
                    {todo.priority}
                  </Chip>
                )}

                {/* Due Date */}
                {todo.due_date && (
                  <div
                    className={`flex items-center gap-1 text-xs ${
                      isOverdue ? "text-danger" : "text-foreground-500"
                    }`}
                  >
                    <CalendarIcon className="h-3 w-3" />
                    {format(new Date(todo.due_date), "MMM d")}
                  </div>
                )}

                {/* Labels */}
                {todo.labels.map((label) => (
                  <Chip key={label} size="sm" variant="flat">
                    {label}
                  </Chip>
                ))}

                {/* Subtasks Count */}
                {todo.subtasks.length > 0 && (
                  <Button
                    size="sm"
                    variant="light"
                    className="h-6 min-w-0 px-2"
                    onPress={() => setShowSubtasks(!showSubtasks)}
                  >
                    {showSubtasks ? (
                      <ChevronDown className="h-3 w-3" />
                    ) : (
                      <ChevronRight className="h-3 w-3" />
                    )}
                    {todo.subtasks.filter((s) => s.completed).length}/
                    {todo.subtasks.length}
                  </Button>
                )}
              </div>

              {/* Subtasks */}
              {showSubtasks && todo.subtasks.length > 0 && (
                <div className="mt-3 ml-2 space-y-1">
                  {todo.subtasks.map((subtask) => (
                    <div key={subtask.id} className="flex items-center gap-2">
                      <Checkbox
                        size="sm"
                        isSelected={subtask.completed}
                        onChange={async () => {
                          try {
                            const updatedTodo = await TodoService.updateSubtask(
                              todo.id,
                              subtask.id,
                              { completed: !subtask.completed },
                            );
                            onUpdate(todo.id, updatedTodo);
                          } catch (error) {
                            console.error("Failed to update subtask:", error);
                          }
                        }}
                      />
                      <span
                        className={`text-xs ${
                          subtask.completed
                            ? "text-foreground-500 line-through"
                            : ""
                        }`}
                      >
                        {subtask.title}
                      </span>
                    </div>
                  ))}

                  {/* Add Subtask */}
                  {addingSubtask ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        value={newSubtaskTitle}
                        onChange={(e) => setNewSubtaskTitle(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleAddSubtask();
                          if (e.key === "Escape") {
                            setAddingSubtask(false);
                            setNewSubtaskTitle("");
                          }
                        }}
                        placeholder="Add subtask..."
                        className="flex-1 rounded border border-default-200 px-2 py-1 text-xs"
                        autoFocus
                      />
                      <Button
                        size="sm"
                        variant="flat"
                        className="h-6 min-w-0 px-2"
                        onPress={handleAddSubtask}
                      >
                        Add
                      </Button>
                    </div>
                  ) : (
                    <Button
                      size="sm"
                      variant="light"
                      className="h-6 px-2"
                      startContent={<Plus className="h-3 w-3" />}
                      onPress={() => setAddingSubtask(true)}
                    >
                      Add subtask
                    </Button>
                  )}
                </div>
              )}
            </div>

            {/* Actions Menu */}
            <Dropdown>
              <DropdownTrigger>
                <Button
                  isIconOnly
                  size="sm"
                  variant="light"
                  className="h-6 w-6 min-w-6"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownTrigger>
              <DropdownMenu aria-label="Todo actions">
                <DropdownItem
                  key="edit"
                  startContent={<Edit2 className="h-4 w-4" />}
                  onPress={() => setEditOpen(true)}
                >
                  Edit
                </DropdownItem>
                <DropdownItem
                  key="delete"
                  startContent={<Trash2 className="h-4 w-4" />}
                  className="text-danger"
                  color="danger"
                  onPress={() => onDelete(todo.id)}
                >
                  Delete
                </DropdownItem>
              </DropdownMenu>
            </Dropdown>
          </div>
        </CardBody>
      </Card>

      {/* Edit Modal */}
      <EditTodoModal
        todo={todo}
        open={editOpen}
        onOpenChange={setEditOpen}
        onSuccess={(updatedTodo) => {
          onUpdate(todo.id, updatedTodo);
          setEditOpen(false);
        }}
      />
    </>
  );
}
