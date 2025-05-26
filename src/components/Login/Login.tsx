"use client";

import { Spinner } from "@heroui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GoogleColouredIcon } from "@/components/Misc/icons";
import { Button } from "@/components/ui/button";
import { useUser } from "@/hooks/useUser";

import { FlickeringGrid } from "../MagicUI/flickering-grid";
import { handleAuthButtonClick } from "./authHelpers";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (user?.email) router.push("/c");
  }, [user, router]);

  return (
    <form className="flex h-screen w-screen flex-row items-center justify-center gap-10 overflow-auto select-none">
      <div className="0 relative z-1 flex w-full flex-col items-center justify-center gap-5 p-10">
        <div className="mb-3 space-y-2 text-center">
          <div className="text-5xl font-medium">Welcome back!</div>
          <div className="text-lg text-foreground-600">
            Your personal AI assistant is ready to help you today.
          </div>
        </div>
        <Button
          className={`text-md gap-2 rounded-full px-4 ${
            loading ? "bg-zinc-800 text-primary hover:bg-zinc-800" : "bg-white"
          }`}
          size="lg"
          type="button"
          disabled={loading}
          onClick={() => handleAuthButtonClick(setLoading)}
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span>Loading ...</span>
            </>
          ) : (
            <>
              <GoogleColouredIcon />
              <span>Sign in with Google</span>
            </>
          )}
        </Button>
        <Link href="/signup">
          <Button
            className="text-md gap-2 rounded-full px-4 font-normal text-primary"
            size="lg"
            type="button"
            variant="link"
          >
            New to GAIA? Create an Account
          </Button>
        </Link>
      </div>
      <div className="relative h-full w-[170%]">
        <FlickeringGrid
          className="absolute inset-0 z-0 size-full [mask-image:linear-gradient(to_right,rgba(0,0,0,0),rgba(0,0,0,1),rgba(0,0,0,1))] [mask-size:100%_100%] [mask-repeat:no-repeat]"
          squareSize={4}
          gridGap={8}
          color="#00bbff"
          maxOpacity={0.8}
          flickerChance={0.7}
        />
      </div>
    </form>
  );
}
