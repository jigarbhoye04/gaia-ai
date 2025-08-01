"use client";

import Image from "next/image";
import Link from "next/link";
import React from "react";

import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@/components/ui/shadcn/navigation-menu";
import {
  companyNavLinks,
  connectNavLinks,
  productNavLinks,
  resourcesNavLinks,
} from "@/config/appConfig";
import { cn } from "@/lib/utils";

const ListItem = React.forwardRef<
  React.ComponentRef<"a">,
  React.ComponentPropsWithoutRef<"a"> & {
    title: string;
    children?: React.ReactNode;
    href: string;
    external?: boolean;
    icon?: React.ReactNode;
    commented?: boolean;
  }
>(({ className, title, children, href, external, icon, ...props }, ref) => {
  const Component = external ? "a" : Link;
  const linkProps = external
    ? { href, target: "_blank", rel: "noopener noreferrer" }
    : { href };

  return (
    <li>
      <NavigationMenuLink asChild>
        <Component
          ref={ref}
          className={cn(
            "flex w-full flex-col justify-start rounded-xl border-1 border-zinc-800 bg-zinc-800/50 p-4 leading-none no-underline transition-all duration-150 select-none hover:border-zinc-700 hover:bg-zinc-800 hover:text-zinc-100 focus:bg-zinc-800 focus:text-zinc-100",
            className,
          )}
          {...linkProps}
          {...props}
        >
          <div className="flex items-center gap-2">
            {icon && (
              <span className="flex-shrink-0 text-primary group-hover:text-zinc-300">
                {icon}
              </span>
            )}
            <div className="text-base leading-none font-medium text-zinc-100">
              {title}
            </div>
          </div>
          {children && (
            <p className="mt-1 line-clamp-2 text-sm leading-tight text-zinc-400">
              {children}
            </p>
          )}
        </Component>
      </NavigationMenuLink>
    </li>
  );
});
ListItem.displayName = "ListItem";

export function MainNavigationMenu() {
  // Description mappings - consolidated and DRY
  const descriptions = {
    // Product
    Features: "Discover all the powerful capabilities of GAIA",
    Roadmap: "See what's coming next",
    Status: "Check the status of GAIA",
    "Use Cases": "Learn how GAIA can transform your workflow",

    // Resources
    Blog: "Read the latest updates and insights",
    Docs: "Comprehensive documentation and guides",
    Pricing: "Choose the perfect plan for your needs",
    "Feature Request": "Request new features and vote on ideas",

    // Company
    About: "Learn about our mission",
    Contact: "Get in touch with our team",
    Terms: "Terms of service and usage",
    Privacy: "Our privacy policy",

    // Connect
    Discord: "Join the Community Discord",
    "Twitter (X)": "Follow us for updates",
    GitHub: "Check out our open source projects",
    WhatsApp: "Join our WhatsApp Community ",
    LinkedIn: "Follow our LinkedIn Company Page",
    YouTube: "Subscribe to our YouTube Channel",
  } as const;

  const getDescription = (label: string): string => {
    return descriptions[label as keyof typeof descriptions] || "";
  };

  return (
    <NavigationMenu>
      <NavigationMenuList>
        {/* PRODUCT */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Product</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-full grid-cols-2 grid-rows-2 gap-4 p-6">
              <li className="row-span-2 md:col-span-1">
                <NavigationMenuLink asChild>
                  <Link
                    className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl! border border-zinc-800/50 bg-gradient-to-b from-zinc-900 to-zinc-950 p-3 no-underline outline-none select-none hover:from-zinc-800 hover:to-zinc-900"
                    href="/"
                  >
                    <Image
                      fill={true}
                      src="/branding/logo.webp"
                      alt="website logo"
                      className="relative z-0 scale-90 object-contain pb-10 opacity-5 grayscale-100"
                    />

                    <div className="relative z-[1] mt-4 text-lg font-medium text-zinc-100">
                      GAIA
                    </div>
                    <p className="relative z-[1] text-sm leading-tight text-zinc-400">
                      Your personal AI assistant
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {productNavLinks.map((link) => (
                <ListItem
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  external={link.external}
                  icon={link.icon}
                  commented={!!link.commented}
                >
                  {getDescription(link.label)}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* RESOURCES */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Resources</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-full grid-cols-2 grid-rows-2 gap-4 p-6">
              {resourcesNavLinks.map((link) => (
                <ListItem
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  external={link.external}
                  icon={link.icon}
                  commented={!!link.commented}
                >
                  {getDescription(link.label)}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* COMPANY */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Company</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-full grid-cols-2 grid-rows-2 gap-4 p-6">
              {companyNavLinks.map((link) => (
                <ListItem
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  external={link.external}
                  icon={link.icon}
                  commented={!!link.commented}
                >
                  {getDescription(link.label)}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>

        {/* CONNECT */}
        <NavigationMenuItem>
          <NavigationMenuTrigger>Socials</NavigationMenuTrigger>
          <NavigationMenuContent>
            <ul className="grid w-full gap-4 p-6 md:grid-cols-3">
              <li className="row-span-2 md:col-span-1">
                <NavigationMenuLink asChild>
                  <Link
                    className="relative flex h-full w-full flex-col justify-end overflow-hidden rounded-2xl! border border-zinc-800/80 bg-gradient-to-b from-zinc-900 to-zinc-950 p-3 no-underline transition-all duration-500 select-none hover:from-zinc-800 hover:to-zinc-950"
                    href="/contact"
                  >
                    <Image
                      fill={true}
                      src="/branding/logo.webp"
                      alt="website logo"
                      className="relative z-0 scale-90 object-contain pb-10 opacity-5 grayscale-100"
                    />

                    <div className="relative z-[1] mt-4 text-lg font-medium text-zinc-100">
                      Need help?
                    </div>
                    <p className="relative z-[1] text-sm leading-tight text-zinc-400">
                      Contact our support team directly
                    </p>
                  </Link>
                </NavigationMenuLink>
              </li>
              {connectNavLinks.map((link) => (
                <ListItem
                  key={link.href}
                  href={link.href}
                  title={link.label}
                  external={link.external}
                  icon={link.icon}
                  commented={!!link.commented}
                >
                  {getDescription(link.label)}
                </ListItem>
              ))}
            </ul>
          </NavigationMenuContent>
        </NavigationMenuItem>
      </NavigationMenuList>
    </NavigationMenu>
  );
}
