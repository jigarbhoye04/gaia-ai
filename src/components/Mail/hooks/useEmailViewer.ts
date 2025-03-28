import { useState } from "react";
import { toast } from "sonner";

import { EmailData, EmailThreadResponse } from "@/types/mailTypes";
import { apiauth } from "@/utils/apiaxios";

import { useEmailReadStatus } from "./useEmailReadStatus";

/**
 * Hook for managing the currently selected/viewed email
 */
export const useEmailViewer = () => {
    const [selectedEmail, setSelectedEmail] = useState<EmailData | null>(null);
    const [threadMessages, setThreadMessages] = useState<EmailData[]>([]);
    const [isLoadingThread, setIsLoadingThread] = useState<boolean>(false);
    const { markAsRead } = useEmailReadStatus();

    // Fetch all messages in the email thread
    const fetchEmailThread = async (threadId: string) => {
        if (!threadId) return;

        setIsLoadingThread(true);
        try {
            const response = await apiauth.get<EmailThreadResponse>(`/gmail/thread/${threadId}`);
            setThreadMessages(response.data.thread.messages || []);
        } catch (error) {
            console.error("Error fetching email thread:", error);
            toast.error("Could not load the complete email thread");
            setThreadMessages([]);
        } finally {
            setIsLoadingThread(false);
        }
    };

    // Open email and mark as read if it's unread
    const openEmail = async (email: EmailData) => {
        setSelectedEmail(email);
        setThreadMessages([]);

        if (email.labelIds?.includes("UNREAD")) {
            await markAsRead(email.id);
        }

        // If this email has a threadId, fetch all messages in the thread
        if (email.threadId) {
            await fetchEmailThread(email.threadId);
        }
    };

    // Close the email detail view
    const closeEmail = () => {
        setSelectedEmail(null);
        setThreadMessages([]);
    };

    return {
        selectedEmail,
        threadMessages,
        isLoadingThread,
        openEmail,
        closeEmail
    };
};