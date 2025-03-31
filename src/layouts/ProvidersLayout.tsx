"use client";

import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ReactNode, Suspense } from "react";

import CalendarModal from "@/components/Calendar/CalendarModal";
import LoginModal from "@/components/Login/LoginModal";
import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import { Toaster } from "@/components/ui/sonner";
import GlobalAuth from "@/hooks/providers/GlobalAuth";
import GlobalInterceptor from "@/hooks/providers/GlobalInterceptor";
import ReduxProviders from "@/redux/providers";

export default function ProvidersLayout({ children }: { children: ReactNode }) {
  const router = useRouter();

  return (
    <Suspense fallback={<SuspenseLoader fullHeight fullWidth />}>
      <HeroUIProvider navigate={router.push}>
        <ReduxProviders>
          <GlobalInterceptor />
          <GlobalAuth />
          <LoginModal />
          <CalendarModal />

          <Toaster closeButton richColors position="top-right" theme="dark" />
          {children}
        </ReduxProviders>
      </HeroUIProvider>
    </Suspense>
  );
}
