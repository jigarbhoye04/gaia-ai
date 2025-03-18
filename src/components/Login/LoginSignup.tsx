"use client";

import { Spinner } from "@heroui/spinner";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { GoogleColouredIcon } from "@/components/Misc/icons";
import { Button } from "@/components/ui/button";
import { handleGoogleLogin } from "@/hooks/handleGoogleLogin";
import { useUser } from "@/hooks/useUser";

export default function LoginSignup({
  isLogin = false,
}: {
  isLogin?: boolean;
}) {
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const user = useUser();

  useEffect(() => {
    if (user?.email && user.email) router.push("/c");
  }, [user]);

  return (
    <form className="flex h-screen w-screen select-none flex-col items-center justify-center overflow-auto">
      <div className="relative z-[1] flex w-full max-w-screen-sm flex-col items-center justify-center gap-5 rounded-3xl bg-zinc-900 p-10">
        <div className="mb-3 space-y-2 text-center">
          <div className="text-5xl font-medium">
            {isLogin ? "Login" : "Sign Up"}
          </div>
          <div className="text-lg text-foreground-600">
            {isLogin
              ? "Welcome back! Please login to continue your journey with GAIA."
              : "Join us today by creating an account. It's quick and easy!"}
          </div>
        </div>
        <Button
          className={`text-md gap-2 rounded-full px-4 ${
            loading ? "bg-zinc-800 text-primary hover:bg-zinc-800" : ""
          }`}
          size="lg"
          type="button"
          variant="secondary"
          disabled={loading}
          onClick={() => {
            setLoading(true);
            handleGoogleLogin();
          }}
        >
          {loading ? (
            <>
              <Spinner size="sm" />
              <span>Loading ...</span>
            </>
          ) : (
            <>
              <GoogleColouredIcon />
              <span>{isLogin ? "Sign in" : "Sign up"} with Google</span>
            </>
          )}
        </Button>
        <Link href={isLogin ? "/get-started" : "/login"}>
          <Button
            className="text-md gap-2 rounded-full px-4 font-normal text-primary"
            size="lg"
            type="button"
            variant="link"
          >
            {isLogin
              ? "New to GAIA? Create an Account"
              : "Already a user? Login here"}
          </Button>
        </Link>
      </div>
    </form>
  );
}
