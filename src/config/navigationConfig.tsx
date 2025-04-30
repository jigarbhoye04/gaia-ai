import { ReactElement } from "react";

import {
  BubbleConversationChatIcon,
  Home01Icon,
  Idea01Icon,
  MapsIcon,
} from "@/components/Misc/icons";

export interface NavLink {
  href: string;
  label: string;
  icon?: ReactElement;
  external?: boolean;
  requiresAuth?: boolean;
  guestOnly?: boolean;
}

// Main navigation links shared between desktop and mobile
export const mainNavLinks: NavLink[] = [
  {
    href: "/",
    label: "Home",
    icon: <Home01Icon width={19} color={undefined} />,
  },
  // {
  //   href: "/about",
  //   label: "About",
  //   icon: <GlobalIcon width={19} color={undefined} />,
  // },
  // {
  //   href: "/blog",
  //   label: "Blog",
  //   icon: <BookOpen02Icon width={19} color={undefined} />,
  // },
  {
    href: "https://gaia.featurebase.app",
    label: "Request a Feature",
    icon: <Idea01Icon width={19} color={undefined} />,
    external: true,
  },
  {
    href: "https://gaia.featurebase.app/roadmap",
    label: "Roadmap",
    icon: <MapsIcon width={19} color={undefined} />,
    external: true,
  },
];

// Authentication related links
export const authNavLinks: NavLink[] = [
  {
    href: "/c",
    label: "Chat",
    icon: <BubbleConversationChatIcon width={17} color={undefined} />,
    requiresAuth: true,
  },
  {
    href: "/login",
    label: "Login",
    guestOnly: true,
  },
  {
    href: "/get-started",
    label: "Get Started",
    guestOnly: true,
  },
];
