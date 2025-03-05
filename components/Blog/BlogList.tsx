import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import Link from "next/link";

// Sample blog data with multiple authors support.
const blogs = [
  {
    slug: "introducing-our-new-api",
    title: "Introducing Our New API: Build Better Integrations",
    date: "March 2, 2025",
    authors: ["Sarah Johnson", "John Doe"],
  },
  {
    slug: "scaling-your-saas-business",
    title: "Scaling Your SaaS Business: Lessons We've Learned",
    date: "February 15, 2025",
    authors: ["Michael Chen"],
  },
  {
    slug: "the-future-of-remote-work",
    title: "The Future of Remote Work: Tools and Strategies",
    date: "January 28, 2025",
    authors: ["Alex Rivera", "Jane Smith"],
  },
  {
    slug: "security-best-practices",
    title: "Security Best Practices for SaaS Companies in 2025",
    date: "January 10, 2025",
    authors: ["Elena Patel", "Robert Brown"],
  },
];

export default function BlogList() {
  return (
    <div className="w-screen flex min-h-screen pt-28 justify-center">
      <div className="max-w-screen-lg">
        <div className="mb-8 text-center">
          <h1>Blog Posts</h1>
        </div>
        <div className="dark">
          {blogs.map((blog) => (
            <div key={blog.slug}>
              <Link href={`/blog/${blog.slug}`}>
                <div className="transition-all bg-black px-5 py-4 grid grid-cols-6 gap-20">
                  <div className="font-medium col-span-3">{blog.title}</div>
                  <div className="truncate ">Category</div>
                  <div className="pt-0 text-sm text-foreground-500 text-nowrap">
                    {blog.date}
                  </div>
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
              <hr className="border-zinc-800" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
