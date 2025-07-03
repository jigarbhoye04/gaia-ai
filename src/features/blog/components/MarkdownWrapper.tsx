"use client";

import MarkdownRenderer from "@/features/chat/components/interface/MarkdownRenderer";

export default function MarkdownWrapper({ content }: { content: string }) {
  return <MarkdownRenderer content={content.toString()} />;
}
