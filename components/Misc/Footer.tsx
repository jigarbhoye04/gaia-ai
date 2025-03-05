import Link from "next/link";
// import MadeBy from "@/components/Landing/MadeBy";

export default function Footer() {
  return (
    <div className="!m-0">
      <div className="w-screen flex h-fit justify-center items-center sm:p-20 p-5">
        <div className="w-full max-w-screen-lg grid grid-cols-2 sm:grid-cols-3 gap-8 ">
          <div className="flex flex-col w-fit h-full text-foreground-600">
            <div className="text-3xl font-medium text-white">G.A.I.A</div>
            <div>© 2024 GAIA</div>
            <div className="text-foreground-500">heygaia.io</div>
          </div>

          <div className="flex flex-col w-fit h-full text-foreground-500">
            <div className="text-xl font-medium text-white">Sitemap</div>
            <div>
              <Link className="hover:underline hover:text-white" href="/blog">
                Blog
              </Link>
            </div>
            <div>
              <Link
                className="hover:underline hover:text-white"
                href="/contact"
              >
                Contact
              </Link>
            </div>
            <div>
              <Link
                className="hover:underline hover:text-white"
                href="/pricing"
              >
                Pricing
              </Link>
            </div>
          </div>

          <div className="flex flex-col w-fit h-full text-foreground-500">
            <div className="text-xl font-medium text-white">Legal</div>
            <div>
              <Link className="hover:underline hover:text-white" href="/terms">
                Terms
              </Link>
            </div>
            <div>
              <Link
                className="hover:underline hover:text-white"
                href="/privacy"
              >
                Privacy
              </Link>
            </div>
          </div>
          {/* 
          <div className="flex flex-col w-fit h-full text-foreground-500">
            <div className="text-xl font-medium text-white">Pages</div>
            <div>
              <Link className="hover:underline hover:text-white" href="/page1">
                Page 1
              </Link>
            </div>
            <div>
              <Link className="hover:underline hover:text-white" href="/page2">
                Page 2
              </Link>
            </div>
            <div>
              <Link className="hover:underline hover:text-white" href="/page3">
                Page 3
              </Link>
            </div>
          </div> */}
        </div>
      </div>
      {/* <MadeBy /> */}
    </div>
  );
}
