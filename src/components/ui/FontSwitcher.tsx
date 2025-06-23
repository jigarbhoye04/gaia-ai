"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/shadcn/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/shadcn/dropdown-menu";

type FontFamily = "sf" | "switzer" | "creato";

export default function FontSwitcher() {
  const [currentFont, setCurrentFont] = useState<FontFamily>("sf");

  useEffect(() => {
    // Apply the font to the body element
    document.body.className = document.body.className
      .replace(/font-(sf|switzer|creato)/g, "")
      .trim();
    document.body.classList.add(`font-${currentFont}`);
  }, [currentFont]);

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" className="w-32">
          Font: {fontDisplayName(currentFont)}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => setCurrentFont("sf")}>
          SF Pro
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrentFont("switzer")}>
          Switzer
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => setCurrentFont("creato")}>
          Creato
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function fontDisplayName(font: FontFamily): string {
  switch (font) {
    case "sf":
      return "SF Pro";
    case "switzer":
      return "Switzer";
    case "creato":
      return "Creato";
  }
}
