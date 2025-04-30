"use client";

import { Providers } from "@/app/providers";
import CalendarModal from "@/components/Calendar/CalendarModal";
import LoginModal from "@/components/Login/LoginModal";
import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import { Toaster } from "@/components/ui/sonner";
import GlobalAuth from "@/hooks/providers/GlobalAuth";
import GlobalInterceptor from "@/hooks/providers/GlobalInterceptor";
import ReduxProviders from "@/redux/providers";
import { ReactNode, Suspense } from "react";

export default function ProvidersLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SuspenseLoader fullHeight fullWidth />}>
      <Providers>
        <ReduxProviders>
          <GlobalInterceptor />
          <GlobalAuth />
          <LoginModal />
          <CalendarModal />

          <Toaster closeButton richColors position="top-right" theme="dark" />
          {children}
        </ReduxProviders>
      </Providers>
    </Suspense>
  );
}
