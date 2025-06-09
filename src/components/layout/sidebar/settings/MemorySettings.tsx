"use client";

import MemoryManagement from "@/features/memory/components/MemoryManagement";

export default function MemorySettings() {
  return (
    <div className="h-full w-full space-y-6">
      {/* Memory Management */}
      <div className="flex h-full flex-col rounded-2xl bg-zinc-900 p-6">
        <MemoryManagement />
      </div>
    </div>
  );
}
