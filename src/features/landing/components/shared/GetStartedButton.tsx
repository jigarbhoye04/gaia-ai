import { Button } from "@heroui/button";
import { ArrowUpRight } from "lucide-react";
import Link from "next/link";
export default function GetStartedButton() {
  return (
    <Button
      as={Link}
      className="group relative mt-12 overflow-hidden border-none font-medium transition-all! duration-300 hover:-translate-y-1 hover:scale-105 sm:mt-14"
      color="primary"
      size="lg"
      radius="lg"
      href={"/signup"}
      variant="shadow"
    >
      <div className="relative z-10 flex items-center gap-1 transition-all duration-100">
        Get Started for Free
        <ArrowUpRight className="transition-transform group-hover:translate-x-0.5" />
      </div>
    </Button>
  );
}
