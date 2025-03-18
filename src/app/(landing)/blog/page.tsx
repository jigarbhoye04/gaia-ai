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
    <div className="w-screen flex min-h-screen pt-28 justify-center px-6">
      <div className="max-w-screen-lg w-full">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Blog Posts</h1>
          <p className="text-zinc-400">
            Latest updates and insights from GAIA.
          </p>
        </div>

        <div className="dark space-y-4">
          {blogs.length > 0 ? (
            blogs.map((blog) => (
              <div key={blog.slug}>
                <Link href={`/blog/${blog.slug}`} className="block">
                  <div className="transition-all bg-black hover:bg-zinc-800 px-6 py-4 flex justify-between items-center cursor-pointer rounded-lg shadow-md">
                    <div className="font-medium flex-1">{blog.title}</div>
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
                              author
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
