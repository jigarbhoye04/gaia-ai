import { Button } from "@heroui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
export default function GetStartedButton() {
  return (
    <Button
      as={Link}
      className="group relative mt-12 overflow-hidden border-none font-medium outline outline-4 outline-[#9ae4ff] transition-all duration-300 hover:-translate-y-1 hover:scale-110 hover:outline-[#00bbff] sm:mt-14"
      color="primary"
      radius="full"
      size="lg"
      href={"/get-started"}
      variant="shadow-sm"
    >
      {/* <span className="absolute inset-0 bg-[#9ae4ff] translate-x-full group-hover:translate-x-0 transition-all duration-200 ease-out rounded-full flex items-center justify-center group-hover:opacity-100 opacity-0">
        Try GAIA now
        <ArrowUpRight className="transition-transform group-hover:translate-x-0.5" />
      </span> */}

      <span className="absolute inset-0 translate-x-full rounded-full bg-[#9ae4ff] transition-all duration-200 ease-out group-hover:translate-x-0" />

      {/* group-hover:opacity-0 */}
      <div className="relative z-10 flex items-center gap-1 transition-all duration-100">
        Get Started for Free
        <ArrowUpRight className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Button>
  );
}
