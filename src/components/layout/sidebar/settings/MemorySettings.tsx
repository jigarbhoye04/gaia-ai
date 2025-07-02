"use client";

import { AiBrain01Icon } from "@/components/shared/icons";
import MemoryManagement from "@/features/memory/components/MemoryManagement";

export default function MemorySettings() {
  return (
    <div className="h-full w-full space-y-6">
      {/* Memory Management */}
      <div className="flex h-full flex-col rounded-2xl bg-zinc-900 p-6">
        <div className="mb-6 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-yellow-500/10">
            <AiBrain01Icon className="h-5 w-5 text-yellow-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Memory Management</h3>
            <p className="text-sm text-zinc-400">
              Manage the information GAIA remembers from your conversations
            </p>
          </div>
        </div>
        <MemoryManagement />
      </div>
    </div>
  );
}
