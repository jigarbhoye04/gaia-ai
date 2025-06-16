import type { Metadata } from "next";
import { Suspense } from "react";
import ReactMarkdown from "react-markdown";

import { AuthorTooltip } from "@/features/blog/components/AuthorTooltip";
import { api } from "@/lib/api";
import type { AboutData, Author } from "@/types/api/aboutApiTypes";

export const metadata: Metadata = {
  title: "About",
  description:
    "Learn more about GAIA, your personal AI assistant designed to enhance productivity, automate tasks, and assist in daily activities.",
  openGraph: {
    title: "About",
    siteName: "GAIA - Personal Assistant",
    url: "https://heygaia.io/about",
    type: "website",
    description:
      "Learn more about GAIA, your personal AI assistant designed to enhance productivity, automate tasks, and assist in daily activities.",
    images: ["/landing/screenshot.webp"],
  },
  twitter: {
    card: "summary_large_image",
    title: "About",
    description:
      "Learn more about GAIA, your personal AI assistant designed to enhance productivity, automate tasks, and assist in daily activities.",
    images: ["/landing/screenshot.webp"],
  },
  keywords: [
    "GAIA",
    "About GAIA",
    "AI Assistant",
    "Artificial Intelligence",
    "Productivity Assistant",
    "Virtual Assistant",
    "Smart Assistant",
    "AI Personal Assistant",
    "Task Management",
    "Automation",
  ],
};

export default async function About() {
  let aboutData: AboutData | null = null;

  try {
    const response = await api.get<AboutData>("/about");
    aboutData = response.data;
  } catch (error) {
    console.error("Error fetching about data:", error);
  }

  if (!aboutData) {
    return (
      <div className="flex min-h-screen w-screen justify-center pt-28">
        <div className="max-w-(--breakpoint-md) space-y-4">
          <p className="text-center text-foreground-400">
            Unable to load about information.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-screen justify-center px-6 pt-28">
      <div className="max-w-(--breakpoint-md) space-y-8">
        <Suspense fallback={<div>Loading...</div>}>
          <div className="prose prose-zinc dark:prose-invert max-w-none">
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h1 className="mb-6 text-center text-3xl font-bold">
                    {children}
                  </h1>
                ),
                h2: ({ children }) => (
                  <h2 className="mt-8 mb-4 text-2xl font-semibold">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="mt-6 mb-3 text-xl font-semibold">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="mb-4 text-justify leading-relaxed text-foreground-600">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="mb-4 ml-6 list-disc space-y-2">{children}</ul>
                ),
                li: ({ children }) => (
                  <li className="text-foreground-600">{children}</li>
                ),
                strong: ({ children }) => (
                  <strong className="font-semibold text-foreground">
                    {children}
                  </strong>
                ),
                code: ({ children }) => (
                  <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-sm dark:bg-zinc-800">
                    {children}
                  </code>
                ),
              }}
            >
              {aboutData.content}
            </ReactMarkdown>
          </div>
        </Suspense>

        <div className="flex items-center justify-center gap-3 border-t border-zinc-200 py-6 dark:border-zinc-800">
          <div className="flex items-center -space-x-2">
            {aboutData.authors.map((author: Author) => (
              <AuthorTooltip
                key={author.name}
                author={author}
                avatarSize="md"
                avatarClassName="h-10 w-10 cursor-help border-2 border-background"
              />
            ))}
          </div>
          <div className="ml-4">
            <div className="font-medium">{aboutData.authors[0]?.name}</div>
            <div className="text-sm text-foreground-500">
              — {aboutData.authors[0]?.role}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
