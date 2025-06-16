import { Button } from "@heroui/button";
import { PlusIcon } from "lucide-react";
import Link from "next/link";

export function BlogHeader() {
  return (
    <div className="mb-8 flex items-center justify-between px-6">
      <div className="flex-1 text-center">
        <h1 className="text-4xl font-bold tracking-tight">Blog</h1>
        <p className="mt-2 text-lg text-foreground-600">
          Insights, updates, and stories from the GAIA team
        </p>
      </div>

      {/* Show create button only if bearer token is configured */}
      {process.env.NEXT_PUBLIC_BLOG_BEARER_TOKEN && (
        <Button
          as={Link}
          href="/blog/create"
          color="primary"
          startContent={<PlusIcon className="h-4 w-4" />}
          className="ml-4 hidden sm:flex"
        >
          Create Post
        </Button>
      )}
    </div>
  );
}
