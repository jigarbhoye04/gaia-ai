"use client";

import { Button } from "@heroui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export function BlogHeader() {
  // Check if bearer token is configured in client-side environment
  const hasBearerToken =
    typeof window !== "undefined" &&
    !!process.env.NEXT_PUBLIC_BLOG_BEARER_TOKEN;

  return (
    <div className="relative mb-8 flex items-center justify-between px-6">
      <div className="flex-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
      </div>

      {/* Show create button only if bearer token is configured */}
      {hasBearerToken && (
        <Button
          as={Link}
          href="/blog/create"
          color="primary"
          startContent={<PlusIcon className="h-4 w-4" />}
          className="absolute right-0 ml-4 hidden sm:flex"
        >
          Create Post
        </Button>
      )}
    </div>
  );
}
