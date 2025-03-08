export interface Link {
  label: string;
  href: string;
  isLoggedIn?: boolean;
}

export interface Section {
  title: string;
  links: Link[];
}

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
        { label: "Blog", href: "/blog" },
        { label: "Contact", href: "/contact" },
        { label: "Pricing", href: "/pricing" },
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
