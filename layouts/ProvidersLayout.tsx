"use client";

import LoginModal from "@/components/Login/LoginModal";
import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import { Toaster } from "@/components/ui/sonner";
import { ConversationListProvider } from "@/contexts/ConversationList";
import GlobalAuth from "@/hooks/providers/GlobalAuth";
import GlobalInterceptor from "@/hooks/providers/GlobalInterceptor";
import useAxiosInterceptor from "@/hooks/useAxiosInterceptor";
import useFetchUser from "@/hooks/useFetchUser";
import ReduxProviders from "@/redux/providers";
import { HeroUIProvider } from "@heroui/system";
import { useRouter } from "next/navigation";
import { ReactNode, Suspense } from "react";

export default function ProvidersLayout({ children }: { children: ReactNode }) {
  const router = useRouter();
  // useFetchUser();
  // useAxiosInterceptor();

  return (
    <Suspense fallback={<SuspenseLoader fullHeight fullWidth />}>
      <ReduxProviders>
        <ConversationListProvider>
          <HeroUIProvider navigate={router.push}>
            <GlobalInterceptor />
            <GlobalAuth />

            <LoginModal />
            <Toaster closeButton richColors position="top-right" theme="dark" />
            {children}
          </HeroUIProvider>
        </ConversationListProvider>
      </ReduxProviders>
    </Suspense>
  );
}
