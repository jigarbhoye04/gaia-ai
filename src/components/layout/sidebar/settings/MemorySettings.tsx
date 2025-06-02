"use client";

import MemoryManagement from "@/features/memory/components/MemoryManagement";

export default function MemorySettings() {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="mb-3">Memory Management</h3>
      <MemoryManagement />
    </div>
  );
}
