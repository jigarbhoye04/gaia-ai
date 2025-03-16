// UI component types for reusability across the application

import { ReactNode } from "react";

// VelocityScroll component types
export interface VelocityScrollProps {
  text: string;
  default_velocity?: number;
  className?: string;
}

export interface ParallaxProps {
  children: string;
  baseVelocity: number;
  className?: string;
}

// Chart component types
export interface ChartConfig {
  [k: string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
  } & (
    | { color?: string; theme?: never }
    | { color?: never; theme: Record<string, string> }
  );
}

// Carousel component types
export type CarouselProps = {
  opts?: any; // CarouselOptions from embla-carousel
  plugins?: any; // CarouselPlugin from embla-carousel
  orientation?: "horizontal" | "vertical";
  setApi?: (api: any) => void;
};

// Sidebar component types
export interface SidebarContextProps {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
}

// Confetti component types
export interface ConfettiProps {
  options?: any; // ConfettiOptions
  globalOptions?: any; // ConfettiGlobalOptions
  manualstart?: boolean;
  children?: ReactNode;
}

// BubblePit component types
export interface BubbleConfig {
  x: number;
  y: number;
  size: number;
  component: ReactNode;
}
