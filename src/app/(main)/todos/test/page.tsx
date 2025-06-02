"use client";

import { useEffect, useState } from "react";

import { Badge } from "@/components/ui/shadcn/badge";
import { Button } from "@/components/ui/shadcn/button";
import { Card } from "@/components/ui/shadcn/card";
import { todoApi } from "@/features/todo/api/todoApi";
import { Todo, TodoListResponse } from "@/types/features/todoTypes";

export default function TestTodoPage() {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState<TodoListResponse["stats"] | null>(null);

  const testNewAPI = async () => {
    setLoading(true);
    try {
      // Test 1: Get todos with new API (should return paginated response)
      console.log("Testing new API endpoint...");
      const response = await fetch("/api/v1/todos?include_stats=true", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("access_token")}`,
        },
      });
      const data: TodoListResponse = await response.json();

      console.log("New API Response:", data);

      if (data.data && Array.isArray(data.data)) {
        setTodos(data.data);
        if (data.stats) {
          setStats(data.stats);
        }
        console.log("✅ New API is working correctly!");
      }

      // Test 2: search with semantic mode
      console.log("Testing semantic search...");
      const searchResponse = await fetch(
        "/api/v1/todos?q=important&mode=semantic",
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("access_token")}`,
          },
        },
      );
      const searchData = await searchResponse.json();
      console.log("Semantic search Response:", searchData);

      // Test 3: Get today's todos
      console.log("Testing today filter...");
      const todayTodos = await todoApi.getTodayTodos();
      console.log("Today's todos:", todayTodos);

      // Test 4: Get stats
      console.log("Testing stats...");
      const todoStats = await todoApi.getTodoStats();
      console.log("Stats:", todoStats);
    } catch (error) {
      console.error("Test failed:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    testNewAPI();
  }, []);

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-4 text-2xl font-bold">Todo API Integration Test</h1>

      <div className="space-y-4">
        <Card className="p-4">
          <h2 className="mb-2 text-lg font-semibold">API Status</h2>
          <Badge variant={loading ? "secondary" : "default"}>
            {loading ? "Testing..." : "Tests Complete"}
          </Badge>
          <p className="mt-2 text-sm text-gray-600">
            Check the browser console for detailed test results
          </p>
        </Card>

        {stats && (
          <Card className="p-4">
            <h2 className="mb-2 text-lg font-semibold">Todo Statistics</h2>
            <div className="grid grid-cols-2 gap-2 text-sm">
              <div>Total: {stats.total}</div>
              <div>Completed: {stats.completed}</div>
              <div>Pending: {stats.pending}</div>
              <div>Overdue: {stats.overdue}</div>
              <div>Completion Rate: {stats.completion_rate}%</div>
            </div>
          </Card>
        )}

        <Card className="p-4">
          <h2 className="mb-2 text-lg font-semibold">Todos ({todos.length})</h2>
          <div className="space-y-2">
            {todos.slice(0, 5).map((todo) => (
              <div key={todo.id} className="border-b pb-2">
                <p className={todo.completed ? "line-through" : ""}>
                  {todo.title}
                </p>
                <div className="mt-1 flex gap-2">
                  {todo.priority && (
                    <Badge variant="outline" className="text-xs">
                      {todo.priority}
                    </Badge>
                  )}
                  {todo.project_id && (
                    <Badge variant="outline" className="text-xs">
                      Project: {todo.project_id}
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Button onClick={testNewAPI} disabled={loading}>
          Run Tests Again
        </Button>
      </div>
    </div>
  );
}
