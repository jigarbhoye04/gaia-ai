"use client";

import { useEffect, useState } from "react";

export type FontFamily = "sf" | "switzer" | "creato";

// Initialize from localStorage or default to "sf"
const getInitialFont = (): FontFamily => {
  if (typeof window === "undefined") return "sf";
  return (localStorage.getItem("preferredFont") as FontFamily) || "sf";
};

export function useFont() {
  const [font, setFont] = useState<FontFamily>(getInitialFont);

  // Apply font class to body when font changes
  useEffect(() => {
    // Save to localStorage
    localStorage.setItem("preferredFont", font);

    // Update body class
    const body = document.body;
    body.className = body.className
      .replace(/font-(sf|switzer|creato)/g, "")
      .trim();
    body.classList.add(`font-${font}`);
  }, [font]);

  // Helper function to get font display name
  const getFontDisplayName = (fontKey: FontFamily = font): string => {
    switch (fontKey) {
      case "sf":
        return "SF Pro";
      case "switzer":
        return "Switzer";
      case "creato":
        return "Creato";
      default:
        return "SF Pro";
    }
  };

  return {
    font,
    setFont,
    getFontDisplayName,
  };
}
