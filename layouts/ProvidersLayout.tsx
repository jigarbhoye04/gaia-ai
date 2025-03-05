import { ConversationListProvider } from "@/contexts/ConversationList";
import { ConvoProvider } from "@/contexts/CurrentConvoMessages";
import { UserProvider } from "@/contexts/UserContext";
import UIProviderLayout from "@/layouts/UIProviderLayout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient();

export default function ProvidersLayout({ children }: { children: ReactNode }) {
  return (
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
      <UserProvider>
        <UIProviderLayout>
          <ConvoProvider>
            <QueryClientProvider client={queryClient}>
              <ConversationListProvider>{children}</ConversationListProvider>
            </QueryClientProvider>
          </ConvoProvider>
        </UIProviderLayout>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}
