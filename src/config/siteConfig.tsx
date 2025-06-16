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
  CustomerService01Icon,
  GlobalIcon,
  Idea01Icon,
  MapsIcon,
} from "@/components/shared/icons";

export const siteConfig = {
  name: "GAIA",
  copyright: "© 202 GAIA",
  domain: "heygaia.io",
  pageSections: [
    {
      title: "Hello",
      links: [
        { label: "Login", href: "/login" },
        { label: "Signup", href: "/signup" },
        { label: "chat", href: "/c", isLoggedIn: true },
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
        // {
        //   label: "pricing",
        //   href: "/pricing",
        //   icon: <CreditCardPosIcon width={19} />,
        // },
        {
          label: "Contact",
          href: "/contact",
          icon: <CustomerService01Icon width={19} />,
        },
        {
          label: "Status",
          href: "https://status.heygaia.io",
          icon: <BookOpen02Icon width={19} />,
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
