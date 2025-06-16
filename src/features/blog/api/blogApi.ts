import { api } from "@/lib/api";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  email: string;
  avatar?: string;
  linkedin?: string;
  twitter?: string;
  bio?: string;
}

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  description?: string;
  date: string;
  authors: string[];
  author_details?: TeamMember[];
  readTime?: string;
  category?: string;
  content: string;
  image?: string;
  tags?: string[];
}

export interface BlogPostCreate {
  slug: string;
  title: string;
  description?: string;
  date: string;
  authors: string[];
  readTime?: string;
  category?: string;
  content: string;
  image?: string;
  tags?: string[];
}

export interface BlogPostUpdate {
  title?: string;
  description?: string;
  date?: string;
  authors?: string[];
  readTime?: string;
  category?: string;
  content?: string;
  image?: string;
  tags?: string[];
}

export const blogApi = {
  getBlogs: async (): Promise<BlogPost[]> => {
    const response = await api.get<BlogPost[]>("/blogs");
    return response.data;
  },

  getBlog: async (slug: string): Promise<BlogPost> => {
    const response = await api.get<BlogPost>(`/blogs/${slug}`);
    return response.data;
  },

  createBlog: async (blog: BlogPostCreate): Promise<BlogPost> => {
    const response = await api.post<BlogPost>("/blogs", blog);
    return response.data;
  },

  updateBlog: async (slug: string, blog: BlogPostUpdate): Promise<BlogPost> => {
    const response = await api.put<BlogPost>(`/blogs/${slug}`, blog);
    return response.data;
  },

  deleteBlog: async (slug: string): Promise<void> => {
    await api.delete(`/blogs/${slug}`);
  },
};
