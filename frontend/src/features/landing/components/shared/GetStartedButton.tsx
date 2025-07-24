import { Button } from "@heroui/button";
import Link from "next/link";

export default function GetStartedButton({
  small_text = false,
  text = "Start for free",
}: {
  small_text?: boolean;
  text?: string;
}) {
  return (
    <div className="flex flex-col items-center gap-4 ">
      <Button
        as={Link}
        // size="lg"
        className="group relative overflow-hidden border-none font-medium transition-all! duration-300 shadow-[inset_0_1px_1px_rgba(255,255,255,0.5)]"
        color="primary"
        href={"/signup"}
      >
        <div className="relative z-10 flex items-center gap-1 transition-all duration-100">
          {text}
        </div>
      </Button>
      {small_text && (
        <div className="text-xs text-foreground-300">
          No credit card required. Free forever plan included.
        </div>
      )}
    </div>
  );
}
