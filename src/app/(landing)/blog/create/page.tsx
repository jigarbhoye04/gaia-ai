import type { Metadata } from "next";

import CreateBlogPage from "@/features/blog/components/CreateBlogPage";

export const metadata: Metadata = {
  title: "Create Blog Post",
  description: "Create a new blog post for GAIA",
};

export default function BlogCreatePage() {
  return <CreateBlogPage />;
}
