import { useState } from "react";
import { EmailData } from "@/types/mailTypes";
import { useEmailReadStatus } from "./useEmailReadStatus";

/**
 * Hook for managing the currently selected/viewed email
 */
export const useEmailViewer = () => {
    const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
    const { markAsRead } = useEmailReadStatus();

    // Open email and mark as read if it's unread
    const openEmail = async (email: EmailData) => {
        setSelectedEmail(email);
        if (email.labelIds?.includes("UNREAD")) {
            await markAsRead(email.id);
        }
    };

    // Close the email detail view
    const closeEmail = () => {
        setSelectedEmail(null);
    };

    return {
        selectedEmail,
        openEmail,
        closeEmail
    };
};