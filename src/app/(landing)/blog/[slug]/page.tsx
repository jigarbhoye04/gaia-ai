import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import { Separator } from "@/components/ui/shadcn/separator";
import { blogApi } from "@/features/blog/api/blogApi";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;

  try {
    const blog = await blogApi.getBlog(slug);

    if (!blog) {
      return (
        <div className="flex h-screen items-center justify-center text-medium font-medium text-foreground-500">
          Blog post not found.
        </div>
      );
    }

    return (
      <div className="flex h-fit min-h-screen w-screen justify-center overflow-y-auto pt-28">
        <div className="mx-auto w-full max-w-(--breakpoint-md)">
          <div className="mb-8">
            <Button
              variant="light"
              className="mb-4 font-medium"
              as={Link}
              href="/blog"
              size="sm"
              startContent={<ChevronLeft />}
            >
              Blog
            </Button>

            <h1 className="mb-4 text-2xl font-bold tracking-tight">
              {blog.title}
            </h1>

            <div className="mb-6 flex items-center space-x-4">
              <AvatarGroup>
                {(blog.author_details || []).map((author) => (
                  <Tooltip
                    key={author.id || author.name}
                    content={`${author.name} - ${author.role}`}
                    classNames={{ content: "text-nowrap" }}
                  >
                    <Avatar src={author.avatar} name={author.name} size="sm" />
                  </Tooltip>
                ))}
              </AvatarGroup>
              <div>
                <p className="font-medium">
                  {(blog.author_details || [])
                    .map((author) => author.name)
                    .join(", ")}
                </p>
                <div className="text-muted-foreground flex items-center text-sm">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span className="text-foreground-500">{blog.date}</span>
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-zinc-700" />

            <div className="prose prose-lg dark:prose-invert max-w-none">
              <Markdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight]}
                components={{
                  h1: ({ children }) => (
                    <h1 className="mb-6 text-3xl font-bold text-foreground">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="mt-8 mb-4 text-2xl font-semibold text-foreground">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="mt-6 mb-3 text-xl font-semibold text-foreground">
                      {children}
                    </h3>
                  ),
                  p: ({ children }) => (
                    <p className="mb-4 leading-relaxed text-foreground-600">
                      {children}
                    </p>
                  ),
                  code: ({ children }) => (
                    <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm text-foreground dark:bg-zinc-800">
                      {children}
                    </code>
                  ),
                  pre: ({ children }) => (
                    <pre className="mb-4 overflow-x-auto rounded-lg border bg-zinc-100 p-4 dark:bg-zinc-800">
                      {children}
                    </pre>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="mb-4 border-l-4 border-zinc-300 pl-4 text-foreground-600 italic dark:border-zinc-600">
                      {children}
                    </blockquote>
                  ),
                }}
              >
                {blog.content}
              </Markdown>
            </div>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    return (
      <div>
        Error fetching blog post:{" "}
        {error instanceof Error ? error.message : "Unknown error"}
      </div>
    );
  }
}
