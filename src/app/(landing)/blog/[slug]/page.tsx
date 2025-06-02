// app/blog/[slug]/page.tsx
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";

import { Separator } from "@/components/ui/shadcn/separator";
import { api } from "@/lib/api";

interface BlogPost {
  slug: string;
  title: string;
  description: string;
  date: string;
  authors: string[];
  readTime: string;
  category: string;
  content: string;
}

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  try {
    const { data: blog } = await api.get<BlogPost>(`blogs/${slug}`);

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
                {blog.authors.map((author) => (
                  <Tooltip
                    key={author}
                    content={author}
                    classNames={{ content: "text-nowrap" }}
                  >
                    <Avatar />
                  </Tooltip>
                ))}
              </AvatarGroup>
              <div>
                <p className="font-medium">{blog.authors.join(", ")}</p>
                <div className="text-muted-foreground flex items-center text-sm">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span className="text-foreground-500">{blog.date}</span>
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-zinc-700" />

            <Markdown
            // className="prose prose-sm max-w-none space-y-6"
            // dangerouslySetInnerHTML={{ __html: blog.content }}
            >
              {blog.content}
            </Markdown>
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
