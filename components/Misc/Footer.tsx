import { siteConfig } from "@/config/siteConfig";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";

export default function Footer() {
  return (
    <div className="!m-0">
      <div className="w-screen flex h-fit justify-center items-center sm:p-20 p-5">
        <div className="w-full max-w-screen-lg grid grid-cols-2 sm:grid-cols-4 gap-8 ">
          <div className="flex flex-col w-fit h-full text-foreground-600">
            <div className="text-3xl font-medium text-white">
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
              <div className="uppercase font-normal mb-2 text-foreground-400">
                {section.title}
              </div>
              {section.links.map((link) => (
                <div key={link.href}>
                  <Link
                    href={link.href}
                    className="group relative flex items-center text-white "
                  >
                    <span className="group-hover:text-primary transition-colors">
                      {link.label}
                    </span>

                    <span className="opacity-0 group-hover:opacity-100 transition-all ml-3 -translate-x-20  group-hover:translate-x-0 duration-150">
                      <ArrowUpRight width={17} />
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
