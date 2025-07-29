"use client";

import { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";

interface RedirectLoaderProps {
  url: string;
  external?: boolean;
  replace?: boolean;
}

export function RedirectLoader({ url, replace = false }: RedirectLoaderProps) {
  const router = useRouter();

  useEffect(() => {
    const navigator = replace ? router.replace : router.push;
    navigator(url);
  }, [url, router]);

  return (
    <div className="inset-0 flex h-full flex-1 flex-col items-center justify-center bg-background">
      <div className="mb-6 animate-spin">
        <Image
          src="/branding/logo.webp"
          alt="GAIA"
          width={120}
          height={120}
          priority
        />
      </div>
      <div className="text-lg font-medium text-foreground">
        Redirecting you...
      </div>
    </div>
  );
}
