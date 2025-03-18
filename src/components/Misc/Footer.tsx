import { siteConfig } from "@/config/siteConfig";
import { ArrowUpRight } from "lucide-react";
import { LinkButton } from "./LinkButton";
import Image from "next/image";

export default function Footer() {
  return (
    <div className="!m-0">
      <div className="w-screen flex h-fit justify-center items-center sm:p-20 p-5">
        <div className="w-full max-w-screen-lg grid grid-cols-2 sm:grid-cols-4 gap-8">
          <div className="flex flex-col w-fit h-full text-foreground-600">
            <Image
              src="/branding/logo.webp"
              alt="GAIA Logo"
              width={50}
              height={50}
            />
            <div className="text-3xl font-medium text-white mt-2">
              {siteConfig.name}
            </div>
            <div>{siteConfig.copyright}</div>
            <div className="text-foreground-500">{siteConfig.domain}</div>
          </div>

          {siteConfig.pageSections.map((section) => (
            <div
              key={section.title}
              className="flex flex-col w-fit h-full text-foreground-500"
            >
              <div className="pl-2 uppercase font-normal mb-1 text-foreground-400">
                {section.title}
              </div>
              {section.links.map((link) => (
                <div key={link.href}>
                  <LinkButton
                    href={link.href}
                    className="group relative flex items-center justify-start text-white"
                  >
                    <span className="group-hover:text-primary transition-colors">
                      {link.label}
                    </span>
                    <span className="opacity-0 group-hover:opacity-100 transition-all ml-1 -translate-x-10 group-hover:translate-x-0 duration-150">
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
