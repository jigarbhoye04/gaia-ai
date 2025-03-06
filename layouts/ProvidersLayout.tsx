"use client";

import SuspenseLoader from "@/components/Misc/SuspenseLoader";
import { ConversationListProvider } from "@/contexts/ConversationList";
import { ConvoProvider } from "@/contexts/CurrentConvoMessages";
import { UserProvider } from "@/contexts/UserContext";
import UIProviderLayout from "@/layouts/UIProviderLayout";
import { ReactNode, Suspense } from "react";

export default function ProvidersLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<SuspenseLoader fullHeight fullWidth />}>
      <UserProvider>
        <UIProviderLayout>
          <ConvoProvider>
            <ConversationListProvider>{children}</ConversationListProvider>
          </ConvoProvider>
        </UIProviderLayout>
      </UserProvider>
    </Suspense>
  );
}
