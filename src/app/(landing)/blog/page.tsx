import type { Metadata } from "next";

import { Separator } from "@/components";
import { api } from "@/lib/api";

import { BlogCard } from "./components/BlogCard";
import { BlogHeader } from "./components/BlogHeader";
import { BlogListItem } from "./components/BlogListItem";
import { Blog, dummyBlogData } from "./dummy-blog-data";

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

  // Add dummy blog posts if no blogs are available
  if (blogs.length === 0) {
    blogs = dummyBlogData;
  }

  const latestPosts = blogs.slice(0, 5);
  const remainingPosts = blogs.slice(5);

  return (
    <div className="flex w-screen justify-center px-6 pt-28">
      <div className="w-full max-w-(--breakpoint-lg)">
        <BlogHeader />

        {/* Latest Posts Grid */}
        {latestPosts.length > 0 && (
          <div className="mb-12 px-6">
            <div className="mb-6 grid gap-6">
              {/* First row - 2 posts */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {latestPosts.slice(0, 2).map((blog) => (
                  <BlogCard key={blog.slug} blog={blog} variant="large" />
                ))}
              </div>

              {/* Second row - 3 posts */}
              {latestPosts.length > 2 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {latestPosts.slice(2, 5).map((blog) => (
                    <BlogCard key={blog.slug} blog={blog} variant="small" />
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* More News Section */}
        {remainingPosts.length > 0 && (
          <div className="dark">
            <div className="my-7 space-y-2 px-6">
              <div className="text-sm font-medium text-foreground-300">
                More News
              </div>
              <Separator className="bg-foreground-300" />
            </div>
            {remainingPosts.map((blog) => (
              <BlogListItem key={blog.slug} blog={blog} />
            ))}
          </div>
        )}

        {blogs.length === 0 && (
          <p className="flex h-full items-center justify-center text-center text-zinc-400">
            No posts available.
          </p>
        )}
      </div>
    </div>
  );
}
