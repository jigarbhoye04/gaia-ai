export interface Link {
  label: string;
  href: string;
  isLoggedIn?: boolean;
  external?: boolean;
  icon?: ReactElement;
}

export interface Section {
  title: string;
  links: Link[];
}

import { ReactElement } from "react";

import {
  BookOpen02Icon,
  CreditCardPosIcon,
  CustomerService01Icon,
  GlobalIcon,
  Idea01Icon,
  MapsIcon,
} from "@/components/Misc/icons";

export const siteConfig = {
  name: "gaia",
  copyright: "© 2024 GAIA",
  domain: "heygaia.io",
  pageSections: [
    {
      title: "HELLO",
      links: [
        { label: "Login", href: "/login" },
        { label: "Get Started", href: "/get-started" },
        { label: "Chat", href: "/c", isLoggedIn: true },
      ],
    },
    {
      title: "Sitemap",
      links: [
        { label: "About", href: "/about", icon: <GlobalIcon width={19} /> },
        { label: "Blog", href: "/blog", icon: <BookOpen02Icon width={19} /> },
        {
          label: "Feature Request",
          href: "https://gaia.featurebase.app",
          external: true,
          icon: <Idea01Icon width={19} />,
        },
        {
          label: "Roadmap",
          href: "https://gaia.featurebase.app/roadmap",
          external: true,
          icon: <MapsIcon width={19} />,
        },
        {
          label: "Pricing",
          href: "/pricing",
          icon: <CreditCardPosIcon width={19} />,
        },
        {
          label: "Contact",
          href: "/contact",
          icon: <CustomerService01Icon width={19} />,
        },
      ],
    },
    {
      title: "Legal",
      links: [
        { label: "Terms", href: "/terms" },
        { label: "Privacy", href: "/privacy" },
      ],
    },
  ] as Section[],
};
