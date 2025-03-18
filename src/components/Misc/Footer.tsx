import { ArrowUpRight } from "lucide-react";
import Image from "next/image";

import { siteConfig } from "@/config/siteConfig";

import { LinkButton } from "./LinkButton";

export default function Footer() {
  return (
    <div className="!m-0">
      <div className="flex h-fit w-screen items-center justify-center p-5 sm:p-20">
        <div className="grid w-full max-w-screen-lg grid-cols-2 gap-8 sm:grid-cols-4">
          <div className="flex h-full w-fit flex-col text-foreground-600">
            <Image
              src="/branding/logo.webp"
              alt="GAIA Logo"
              width={50}
              height={50}
            />
            <div className="mt-2 text-3xl font-medium text-white">
              {siteConfig.name}
            </div>
            <div>{siteConfig.copyright}</div>
            <div className="text-foreground-500">{siteConfig.domain}</div>
          </div>

          {siteConfig.pageSections.map((section) => (
            <div
              key={section.title}
              className="flex h-full w-fit flex-col text-foreground-500"
            >
              <div className="mb-1 pl-2 font-normal uppercase text-foreground-400">
                {section.title}
              </div>
              {section.links.map((link) => (
                <div key={link.href}>
                  <LinkButton
                    href={link.href}
                    className="group relative flex items-center justify-start text-white"
                  >
                    <span className="transition-colors group-hover:text-primary">
                      {link.label}
                    </span>
                    <span className="ml-1 -translate-x-10 opacity-0 transition-all duration-150 group-hover:translate-x-0 group-hover:opacity-100">
                      <ArrowUpRight width={17} />
                    </span>
                  </LinkButton>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
