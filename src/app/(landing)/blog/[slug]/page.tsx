import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import Image from "next/image";
import Markdown from "react-markdown";
import rehypeHighlight from "rehype-highlight";
import remarkGfm from "remark-gfm";

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/shadcn/breadcrumb";
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
            <div className="mb-5 flex w-full justify-center text-foreground-400">
              <Breadcrumb>
                <BreadcrumbList>
                  <BreadcrumbItem>
                    <BreadcrumbLink href="/blog">Blog</BreadcrumbLink>
                  </BreadcrumbItem>
                  <BreadcrumbSeparator />
                  <BreadcrumbItem>
                    <BreadcrumbLink>{blog.category}</BreadcrumbLink>
                  </BreadcrumbItem>
                </BreadcrumbList>
              </Breadcrumb>
            </div>

            <h1 className="text-center text-5xl font-medium tracking-tight">
              {blog.title}
            </h1>

            <div className="flex h-fit max-w-3xl items-center justify-center">
              {blog.image && (
                <Image
                  src={blog.image}
                  alt={blog.title}
                  width={1920}
                  height={1080}
                  className="max-w-3xl object-cover"
                />
              )}
            </div>

            <div className="mb-10 flex items-center justify-center space-x-4">
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
              <div>·</div>
              <div>
                <div className="text-muted-foreground flex items-center text-sm">
                  <span className="text-foreground-500">{blog.date}</span>
                </div>
              </div>
            </div>

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
