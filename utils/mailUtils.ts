"use client";
import { EmailsResponse } from "@/types/mailTypes";
import { apiauth } from "@/utils/apiaxios";
import { QueryFunctionContext } from "@tanstack/react-query";

export function parseEmail(from: string): { name: string; email: string } {
  // Improved email parsing
  const match = from.match(/^(.*?)\s*<(.+?)>$/) || from.match(/(.+)/);

  if (match) {
    return {
      name: match[1] ? match[1].trim().replace(/^"|"$/g, "") : "",
      email: match[2] || "",
    };
  }

  return {
    name: "",
    email: from,
  };
}

export function formatTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();

  const diffSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  const diffMonths =
    now.getMonth() -
    date.getMonth() +
    12 * (now.getFullYear() - date.getFullYear());
  const diffYears = now.getFullYear() - date.getFullYear();

  if (diffSeconds < 60) return "Just now";
  if (diffMinutes < 60) return `${diffMinutes}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  if (diffMonths < 1)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  if (diffYears < 1)
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });

  return date.toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export const fetchEmails = async ({
  pageParam = undefined,
}: QueryFunctionContext<string[]>): Promise<EmailsResponse> => {
  const maxResults = 20;
  const url = `/gmail/messages?maxResults=${maxResults}${
    pageParam ? `&pageToken=${pageParam}` : ""
  }`;
  const response = await apiauth.get(url);
  const data = response.data;
  return { emails: data.messages, nextPageToken: data.nextPageToken };
};
