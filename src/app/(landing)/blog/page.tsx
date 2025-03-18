import api from "@/utils/apiaxios";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import Link from "next/link";
import type { Metadata } from "next";

interface Blog {
  slug: string;
  title: string;
  date: string;
  authors: string[];
}

export const metadata: Metadata = {
  title: "Blog",
  description:
    "Explore the latest posts from GAIA, the creators of an advanced AI personal assistant",

  openGraph: {
    title: "Blog",
    description:
      "Explore the latest posts from GAIA, the creators of an advanced AI personal assistant",
    url: "https://heygaia.io/blog",
    images: ["/landing/screenshot.webp"],
    siteName: "GAIA - Your Personal Assistant",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog",
    description:
      "Explore the latest posts from GAIA, the creators of an advanced AI personal assistant",
    images: ["/landing/screenshot.webp"],
  },
};

export default async function BlogList() {
  let blogs: Blog[] = [];

  try {
    const response = await api.get<Blog[]>("/blogs");
    blogs = response.data;
  } catch (error) {
    console.error("Error fetching blogs:", error);
  }

  return (
    <div className="flex min-h-screen w-screen justify-center px-6 pt-28">
      <div className="w-full max-w-screen-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-zinc-400">
            Latest updates and insights from GAIA.
          </p>
        </div>

        <div className="space-y-4 dark">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <div key={blog.slug}>
                <Link href={`/blog/${blog.slug}`} className="block">
                  <div className="flex cursor-pointer items-center justify-between rounded-lg bg-black px-6 py-4 shadow-md transition-all hover:bg-zinc-800">
                    <div className="flex-1 font-medium">{blog.title}</div>
                    <div className="text-sm text-zinc-400">{blog.date}</div>
                    <AvatarGroup isBordered>
                      {blog.authors.map((author) => (
                        <Tooltip
                          key={author}
                          content={author}
                          classNames={{ content: "text-nowrap" }}
                        >
                          <Avatar
                            src={`https://i.pravatar.cc/150?u=${encodeURIComponent(
                              author,
                            )}`}
                            size="sm"
                            name={author}
                          />
                        </Tooltip>
                      ))}
                    </AvatarGroup>
                  </div>
                </Link>
              </div>
            ))
          ) : (
            <p className="text-center text-zinc-400">
              No blog posts available.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
