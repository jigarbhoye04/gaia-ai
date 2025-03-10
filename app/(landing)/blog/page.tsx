import api from "@/utils/apiaxios";
import { Avatar, AvatarGroup } from "@heroui/avatar";
import { Tooltip } from "@heroui/tooltip";
import Link from "next/link";

interface Blog {
  slug: string;
  title: string;
  date: string;
  authors: string[];
}

export default async function BlogList() {
  let blogs: Blog[] = [];
  try {
    const response = await api.get<Blog[]>("/blogs");
    blogs = response.data;
  } catch (error: any) {
    console.error("Error fetching blogs:", error);
  }

  return (
    <div className="w-screen flex min-h-screen pt-28 justify-center">
      <div className="max-w-screen-lg">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold">Blog Posts</h1>
        </div>
        <div className="dark">
          {blogs.map((blog, index) => (
            <div key={blog.slug}>
              <Link href={`/blog/${blog.slug}`}>
                <div className="transition-all bg-black hover:bg-zinc-800 px-5 py-3 grid grid-cols-6 gap-20 items-center cursor-pointer">
                  <div className="font-medium col-span-3">{blog.title}</div>
                  <div className="truncate">Category</div>
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
              {index !== blogs.length - 1 && <hr className="border-zinc-800" />}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
