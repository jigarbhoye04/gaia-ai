"use client";

import LoginModal from "@/components/Login/LoginModal";
import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import { Toaster } from "@/components/ui/sonner";
import { ConversationListProvider } from "@/contexts/ConversationList";
import { ConvoProvider } from "@/contexts/CurrentConvoMessages";
import GlobalAuth from "@/hooks/providers/GlobalAuth";
import GlobalInterceptor from "@/hooks/providers/GlobalInterceptor";
import UIProviderLayout from "@/layouts/UIProviderLayout";
import ReduxProviders from "@/redux/providers";
import { ReactNode, Suspense } from "react";

export default function ProvidersLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SuspenseLoader fullHeight fullWidth />}>
      <ReduxProviders>
        <UIProviderLayout>
          <ConvoProvider>
            <ConversationListProvider>
              {/* Global Providers for Hooks  */}
              <GlobalInterceptor />
              <GlobalAuth />

              <LoginModal />
              <Toaster
                closeButton
                richColors
                position="top-right"
                theme="dark"
              />
              {children}
            </ConversationListProvider>
          </ConvoProvider>
        </UIProviderLayout>
      </ReduxProviders>
    </Suspense>
  );
}
