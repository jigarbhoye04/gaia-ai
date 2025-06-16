import axios from "axios";

import { api } from "@/lib/api";

export interface TeamMember {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  linkedin?: string;
  twitter?: string;
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
  getBlogs: async (includeContent: boolean = false): Promise<BlogPost[]> => {
    const response = await api.get<BlogPost[]>(
      `/blogs?include_content=${includeContent}`,
    );
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

  createBlogWithAuth: async (
    blog: BlogPostCreate,
    bearerToken: string,
  ): Promise<BlogPost> => {
    const response = await axios.post<BlogPost>(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/blogs`,
      blog,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  },

  updateBlog: async (slug: string, blog: BlogPostUpdate): Promise<BlogPost> => {
    const response = await api.put<BlogPost>(`/blogs/${slug}`, blog);
    return response.data;
  },

  updateBlogWithAuth: async (
    slug: string,
    blog: BlogPostUpdate,
    bearerToken: string,
  ): Promise<BlogPost> => {
    const response = await axios.put<BlogPost>(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/blogs/${slug}`,
      blog,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          "Content-Type": "application/json",
        },
      },
    );
    return response.data;
  },

  deleteBlog: async (slug: string): Promise<void> => {
    await api.delete(`/blogs/${slug}`);
  },

  deleteBlogWithAuth: async (
    slug: string,
    bearerToken: string,
  ): Promise<void> => {
    await axios.delete(
      `${process.env.NEXT_PUBLIC_API_BASE_URL}/blogs/${slug}`,
      {
        headers: {
          Authorization: `Bearer ${bearerToken}`,
        },
      },
    );
  },
};
