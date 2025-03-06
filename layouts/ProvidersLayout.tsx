"use client";

import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import { ConversationListProvider } from "@/contexts/ConversationList";
import { ConvoProvider } from "@/contexts/CurrentConvoMessages";
import { UserProvider } from "@/contexts/UserContext";
import UIProviderLayout from "@/layouts/UIProviderLayout";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactNode, Suspense } from "react";

const queryClient = new QueryClient();

export default function ProvidersLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SuspenseLoader fullHeight fullWidth />}>
      <UserProvider>
        <UIProviderLayout>
          <ConvoProvider>
            <QueryClientProvider client={queryClient}>
              <ConversationListProvider>{children}</ConversationListProvider>
            </QueryClientProvider>
          </ConvoProvider>
        </UIProviderLayout>
      </UserProvider>
    </Suspense>
  );
}
