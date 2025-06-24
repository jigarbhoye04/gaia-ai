import { ReactElement } from "react";

import {
  BubbleConversationChatIcon,
  CreditCardPosIcon,
  DiscordIcon,
  Home01Icon,
  Idea01Icon,
  MapsIcon,
} from "@/components/shared/icons";

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

  {
    href: "https://gaia.featurebase.app",
    label: "Request a Feature",
    icon: <Idea01Icon width={19} color={undefined} />,
    external: true,
  },
  {
    label: "Pricing",
    href: "/pricing",
    icon: <CreditCardPosIcon width={19} color={undefined} />,
  },
  {
    href: "https://gaia.featurebase.app/roadmap",
    label: "Roadmap",
    icon: <MapsIcon width={19} color={undefined} />,
    external: true,
  },
  {
    label: "Discord",
    href: "https://discord.heygaia.io",
    external: true,
    icon: <DiscordIcon width={19} />,
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
    href: "/signup",
    label: "Signup",
    guestOnly: true,
  },
];
