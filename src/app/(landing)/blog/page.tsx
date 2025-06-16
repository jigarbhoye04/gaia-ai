import type { Metadata } from "next";

import { Separator } from "@/components";
import { blogApi, type BlogPost } from "@/features/blog/api/blogApi";

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
  let blogs: BlogPost[] = [];
  let fallbackBlogs: Blog[] = [];

  try {
    blogs = await blogApi.getBlogs(false); // Don't include content for list view - better performance
  } catch (error) {
    console.error("Error fetching blogs:", error);
    fallbackBlogs = dummyBlogData;
  }

  // Convert BlogPost to Blog format for compatibility
  const displayBlogs =
    blogs.length > 0
      ? blogs.map((blog) => ({
          slug: blog.slug,
          title: blog.title,
          category: blog.category || "Uncategorized",
          date: blog.date,
          image: blog.image || "/media/glass.png",
          authors:
            blog.author_details?.map((author) => ({
              name: author.name,
              role: author.role,
              avatar:
                author.avatar || `https://i.pravatar.cc/150?u=${author.name}`,
              linkedin: author.linkedin,
              twitter: author.twitter,
            })) ||
            blog.authors.map((name) => ({
              name: typeof name === "string" ? name : name,
              role: "Author",
              avatar: `https://i.pravatar.cc/150?u=${name}`,
            })),
        }))
      : fallbackBlogs;

  const latestPosts = displayBlogs.slice(0, 5);
  const remainingPosts = displayBlogs.slice(5);

  return (
    <div className="flex min-h-screen w-screen justify-center px-6 pt-28">
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

        {displayBlogs.length === 0 && (
          <p className="flex h-full items-center justify-center text-center text-zinc-400">
            No posts available.
          </p>
        )}
      </div>
    </div>
  );
}
