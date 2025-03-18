// app/blog/[slug]/page.tsx
import { Separator } from "@/components/ui/separator";
import api from "@/utils/apiaxios";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Tooltip } from "@heroui/tooltip";
import { Calendar, ChevronLeft } from "lucide-react";
import Link from "next/link";
import Markdown from "react-markdown";

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
  params: { slug: string };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = params;
  try {
    const { data: blog } = await api.get<BlogPost>(`blogs/${slug}`);

    if (!blog) {
      return (
        <div className="flex items-center justify-center h-screen text-medium text-foreground-500 font-medium">
          Blog post not found.
        </div>
      );
    }

    return (
      <div className="pt-28 flex justify-center w-screen min-h-screen h-fit overflow-y-auto">
        <div className="max-w-screen-md w-full mx-auto">
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

            <h1 className="text-2xl font-bold tracking-tight mb-4">
              {blog.title}
            </h1>

            <div className="flex items-center space-x-4 mb-6">
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
                <div className="flex items-center text-sm text-muted-foreground">
                  <Calendar className="mr-1 h-4 w-4" />
                  <span className="text-foreground-500">{blog.date}</span>
                </div>
              </div>
            </div>

            <Separator className="my-6 bg-zinc-700" />

            <Markdown
              className="prose prose-sm max-w-none space-y-6"
            // dangerouslySetInnerHTML={{ __html: blog.content }}
            >
              {blog.content}
            </Markdown>
          </div>
        </div>
      </div>
    );
  } catch (error: any) {
    return <div>Error fetching blog post: {error.message}</div>;
  }
}
