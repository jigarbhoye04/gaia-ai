import React from "react";

interface LegalLayoutProps {
  children: React.ReactNode;
}

export default function LegalLayout({ children }: LegalLayoutProps) {
  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="prose prose-sm sm:prose-base lg:prose-lg mx-auto max-w-4xl">
          {children}
        </div>
      </div>
    </div>
  );
}
