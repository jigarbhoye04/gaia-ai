import { Avatar } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";

import { Separator } from "@/components";
import { LinkedinIcon, TwitterIcon } from "@/components/shared/icons";
import { api } from "@/lib/api";

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
        <div className="mb-8 text-center">
          <h1 className="text-2xl font-bold">Blog</h1>
        </div>

        {/* Latest Posts Grid */}
        {latestPosts.length > 0 && (
          <div className="mb-12">
            <div className="mb-6 grid gap-6">
              {/* First row - 2 posts */}
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
                {latestPosts.slice(0, 2).map((blog) => (
                  <Link
                    key={blog.slug}
                    href={`/blog/${blog.slug}`}
                    className="block"
                  >
                    <div className="group overflow-hidden rounded-lg bg-zinc-900 transition-all hover:bg-zinc-800">
                      <div className="relative aspect-video">
                        <Image
                          src={blog.image}
                          alt={blog.title}
                          fill
                          className="object-cover transition-transform duration-300 group-hover:scale-105"
                        />
                      </div>
                      <div className="p-6">
                        <div className="mb-3 flex items-center gap-2">
                          <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                            {blog.category}
                          </span>
                          <span className="text-xs text-zinc-400">
                            {blog.date}
                          </span>
                        </div>
                        <h3 className="mb-3 text-lg font-semibold text-white transition-colors group-hover:text-blue-300">
                          {blog.title}
                        </h3>
                        <div className="flex items-center -space-x-1">
                          {blog.authors.map((author) => (
                            <Tooltip
                              key={author.name}
                              content={
                                <div className="flex flex-row items-center gap-3 p-2">
                                  <Avatar
                                    src={author.avatar}
                                    size="sm"
                                    className="h-8 w-8"
                                    name={author.name}
                                  />
                                  <div className="flex flex-col">
                                    <span className="text-medium">
                                      {author.name}
                                    </span>
                                    <span className="text-xs text-foreground-500">
                                      {author.role}
                                    </span>
                                  </div>
                                  <div className="mt-1 ml-6 flex gap-2">
                                    {author.linkedin && (
                                      <a
                                        href={author.linkedin}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <LinkedinIcon width={20} height={20} />
                                      </a>
                                    )}
                                    {author.twitter && (
                                      <a
                                        href={author.twitter}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                      >
                                        <TwitterIcon width={20} height={20} />
                                      </a>
                                    )}
                                  </div>
                                </div>
                              }
                              classNames={{ content: "text-nowrap" }}
                            >
                              <Avatar
                                src={author.avatar}
                                size="sm"
                                className="h-8 w-8 cursor-help border-2 border-zinc-700"
                                name={author.name}
                              />
                            </Tooltip>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>

              {/* Second row - 3 posts */}
              {latestPosts.length > 2 && (
                <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
                  {latestPosts.slice(2, 5).map((blog) => (
                    <Link
                      key={blog.slug}
                      href={`/blog/${blog.slug}`}
                      className="block"
                    >
                      <div className="group overflow-hidden rounded-lg bg-zinc-900 transition-all hover:bg-zinc-800">
                        <div className="relative aspect-video">
                          <Image
                            src={blog.image}
                            alt={blog.title}
                            fill
                            className="object-cover transition-transform duration-300 group-hover:scale-105"
                          />
                        </div>
                        <div className="p-4">
                          <div className="mb-2 flex items-center gap-2">
                            <span className="rounded bg-zinc-800 px-2 py-1 text-xs text-zinc-300">
                              {blog.category}
                            </span>
                            <span className="text-xs text-zinc-400">
                              {blog.date}
                            </span>
                          </div>
                          <h3 className="mb-3 line-clamp-2 text-sm font-semibold text-white transition-colors group-hover:text-blue-300">
                            {blog.title}
                          </h3>
                          <div className="flex items-center -space-x-1">
                            {blog.authors.slice(0, 3).map((author) => (
                              <Tooltip
                                key={author.name}
                                content={
                                  <div className="flex flex-row items-center gap-3 p-2">
                                    <Avatar
                                      src={author.avatar}
                                      size="sm"
                                      className="h-8 w-8"
                                      name={author.name}
                                    />
                                    <div className="flex flex-col">
                                      <span className="text-medium">
                                        {author.name}
                                      </span>
                                      <span className="text-xs text-foreground-500">
                                        {author.role}
                                      </span>
                                    </div>
                                    <div className="mt-1 ml-6 flex gap-2">
                                      {author.linkedin && (
                                        <a
                                          href={author.linkedin}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <LinkedinIcon
                                            width={20}
                                            height={20}
                                          />
                                        </a>
                                      )}
                                      {author.twitter && (
                                        <a
                                          href={author.twitter}
                                          target="_blank"
                                          rel="noopener noreferrer"
                                        >
                                          <TwitterIcon width={20} height={20} />
                                        </a>
                                      )}
                                    </div>
                                  </div>
                                }
                                classNames={{ content: "text-nowrap" }}
                              >
                                <Avatar
                                  src={author.avatar}
                                  size="sm"
                                  className="h-6 w-6 cursor-help border-2 border-zinc-700"
                                  name={author.name}
                                />
                              </Tooltip>
                            ))}
                            {blog.authors.length > 3 && (
                              <div className="flex h-6 w-6 items-center justify-center rounded-full border-2 border-zinc-700 bg-zinc-700 text-xs text-zinc-300">
                                +{blog.authors.length - 3}
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* More News Section */}
        {remainingPosts.length > 0 && (
          <div className="dark">
            <div className="mb-7 space-y-2 px-6">
              <div className="text-sm font-medium text-foreground-300">
                More News
              </div>
              <Separator className="bg-foreground-300" />
            </div>
            {remainingPosts.map((blog) => (
              <div key={blog.slug}>
                <Link href={`/blog/${blog.slug}`} className="block">
                  <div className="grid grid-cols-[minmax(0,4fr)_minmax(0,1.5fr)_minmax(0,1fr)_minmax(0,0.7fr)] items-center rounded-lg px-6 py-4 transition-all hover:bg-zinc-800">
                    <div className="truncate text-sm">{blog.title}</div>
                    <div className="text-sm text-foreground-400">
                      {blog.category}
                    </div>
                    <div className="text-sm text-foreground-400">
                      {blog.date}
                    </div>
                    <div className="flex items-center -space-x-1">
                      {blog.authors.map((author) => (
                        <Tooltip
                          key={author.name}
                          content={
                            <div className="flex flex-row items-center gap-3 p-2">
                              <Avatar
                                src={author.avatar}
                                size="sm"
                                className="h-8 w-8"
                                name={author.name}
                              />

                              <div className="flex flex-col">
                                <span className="text-medium">
                                  {author.name}
                                </span>
                                <span className="text-xs text-foreground-500">
                                  {author.role}
                                </span>
                              </div>
                              <div className="mt-1 ml-6 flex gap-2">
                                {author.linkedin && (
                                  <a
                                    href={author.linkedin}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <LinkedinIcon width={20} height={20} />
                                  </a>
                                )}
                                {author.twitter && (
                                  <a
                                    href={author.twitter}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                  >
                                    <TwitterIcon width={20} height={20} />
                                  </a>
                                )}
                              </div>
                            </div>
                          }
                          classNames={{ content: "text-nowrap" }}
                        >
                          <Avatar
                            src={author.avatar}
                            size="sm"
                            className="h-6 w-6 cursor-help"
                            name={author.name}
                          />
                        </Tooltip>
                      ))}
                    </div>
                  </div>
                </Link>
              </div>
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
