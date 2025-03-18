"use client";

import { Button } from "@heroui/button";
import { useRouter } from "next/navigation";
import { LinkBackwardIcon } from "@/components/Misc/icons";

export default function PageNotFound() {
  const router = useRouter();

  return (
    <div className="flex h-screen w-screen flex-col items-center justify-center gap-4">
      <span className="text-6xl font-bold">404</span>
      <span className="text-4xl">Page Not Found</span>
      <Button
        className="mt-3"
        color="primary"
        size="md"
        startContent={<LinkBackwardIcon color={undefined} />}
        onPress={() => router.back()}
      >
        Go Back
      </Button>
    </div>
  );
}
