"use client";

import { HeroUIProvider } from "@heroui/system";
import { ReactNode } from "react";
import { useRouter } from "next/navigation";

export default function UIProviderLayout({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();

  return <HeroUIProvider navigate={router.push}>{children}</HeroUIProvider>;
}
