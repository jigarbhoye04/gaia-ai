"use client";

import { ReactNode, Suspense } from "react";

import SuspenseLoader from "@/components/shared/SuspenseLoader";
import { Toaster } from "@/components/ui/shadcn/sonner";
import LoginModal from "@/features/auth/components/LoginModal";
import CalendarModal from "@/features/calendar/components/CalendarModal";
import GlobalAuth from "@/hooks/providers/GlobalAuth";
import GlobalInterceptor from "@/hooks/providers/GlobalInterceptor";
import { HeroUIProvider } from "@/layouts/HeroUIProvider";
import QueryProvider from "@/layouts/QueryProvider";
import ReduxProviders from "@/redux/providers";

export default function ProvidersLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SuspenseLoader fullHeight fullWidth />}>
      <HeroUIProvider>
        <QueryProvider>
          <ReduxProviders>
            <GlobalInterceptor />
            <GlobalAuth />
            <LoginModal />
            <CalendarModal />

            <Toaster closeButton richColors position="top-right" theme="dark" />
            {children}
          </ReduxProviders>
        </QueryProvider>
      </HeroUIProvider>
    </Suspense>
  );
}
