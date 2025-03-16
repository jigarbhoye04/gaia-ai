// Types for layout components and shared layout structures
import { ReactNode } from "react";

// Main layout props
export interface MainLayoutProps {
  children: ReactNode;
}

// Landing section layout props
export interface SectionLayoutProps {
  id?: string;
  className?: string;
  children: ReactNode;
}

// Animated section props
export interface AnimatedSectionProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

// Section heading props
export interface SectionHeadingProps {
  title: string;
  subtitle?: string;
  className?: string;
  align?: "left" | "center" | "right";
}

// CalendarMessages component props
export interface CalendarMessagesProps {
  events: any[];
  addedEvents: number[];
  setAddedEvents: React.Dispatch<React.SetStateAction<number[]>>;
}

// ReadMoreText component props
export interface ReadMoreTextProps {
  children: ReactNode;
  maxHeight?: number;
}