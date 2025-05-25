"use client";

import { Divider } from "@heroui/react";

import MemoryManagement from "@/components/Memory/MemoryManagement";

export default function MemorySettings() {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="mb-3">Memory Management</h3>
      <MemoryManagement />
      <Divider className="my-4" />
    </div>
  );
}
