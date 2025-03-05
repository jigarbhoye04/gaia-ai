import { ConversationListProvider } from "@/contexts/ConversationList";
import { ConvoProvider } from "@/contexts/CurrentConvoMessages";
import { UserProvider } from "@/contexts/UserContext";
import UIProviderLayout from "@/layouts/UIProviderLayout";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { ReactNode } from "react";

interface ProvidersLayoutProps {
  children: ReactNode;
}

export default function ProvidersLayout({ children }: ProvidersLayoutProps) {
  return (
    <GoogleOAuthProvider clientId={process.env.GOOGLE_CLIENT_ID}>
      <UserProvider>
        <UIProviderLayout>
          <ConvoProvider>
            <ConversationListProvider>{children}</ConversationListProvider>
          </ConvoProvider>
        </UIProviderLayout>
      </UserProvider>
    </GoogleOAuthProvider>
  );
}
