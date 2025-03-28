import { InfiniteData, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { toast } from "sonner";

import { EmailsResponse } from "@/types/mailTypes";
import { apiauth } from "@/utils/apiaxios";

/**
 * Hook for managing email multi-selection and bulk actions
 */
export const useEmailSelection = () => {
    const [selectedEmails, setSelectedEmails] = useState<Set<string>>(new Set());
    const queryClient = useQueryClient();

    // Toggle email selection
    const toggleEmailSelection = (e: React.MouseEvent, emailId: string) => {
        e.stopPropagation(); // Prevent opening the email

        setSelectedEmails((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(emailId)) {
                newSet.delete(emailId);
            } else {
                newSet.add(emailId);
            }
            return newSet;
        });
    };

    // Clear all selections
    const clearSelections = () => {
        setSelectedEmails(new Set());
    };

    // Bulk actions for selected emails
    const bulkMarkAsRead = async () => {
        if (selectedEmails.size === 0) return;

        // First update UI optimistically
        queryClient.setQueryData<InfiniteData<EmailsResponse>>(["emails"], (oldData) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                    ...page,
                    emails: page.emails.map((email) => {
                        if (selectedEmails.has(email.id)) {
                            return {
                                ...email,
                                labelIds: (email.labelIds || []).filter(label => label !== "UNREAD"),
                            };
                        }
                        return email;
                    }),
                })),
            };
        });

        // Show immediate success toast
        toast.success(`${selectedEmails.size} emails marked as read`);

        // Clear selections immediately for better UX
        clearSelections();

        // Then make API call in the background
        try {
            await apiauth.post("/gmail/mark-as-read", {
                message_ids: Array.from(selectedEmails),
            });
        } catch (error) {
            console.error("Failed to mark emails as read:", error);
            toast.error("Failed to mark emails as read");
            // Refresh data since we may have incomplete state
            queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
    };

    const bulkMarkAsUnread = async () => {
        if (selectedEmails.size === 0) return;

        // First update UI optimistically
        queryClient.setQueryData<InfiniteData<EmailsResponse>>(["emails"], (oldData) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                    ...page,
                    emails: page.emails.map((email) => {
                        if (selectedEmails.has(email.id)) {
                            const newLabelIds = [...(email.labelIds || [])];
                            if (!newLabelIds.includes("UNREAD")) {
                                newLabelIds.push("UNREAD");
                            }
                            return {
                                ...email,
                                labelIds: newLabelIds,
                            };
                        }
                        return email;
                    }),
                })),
            };
        });

        // Show immediate success toast
        toast.success(`${selectedEmails.size} emails marked as unread`);

        // Clear selections immediately for better UX
        clearSelections();

        // Then make API call in the background
        try {
            await apiauth.post("/gmail/mark-as-unread", {
                message_ids: Array.from(selectedEmails),
            });
        } catch (error) {
            console.error("Failed to mark emails as unread:", error);
            toast.error("Failed to mark emails as unread");
            // Refresh data since we may have incomplete state
            queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
    };

    const bulkStarEmails = async () => {
        if (selectedEmails.size === 0) return;

        // First update UI optimistically
        queryClient.setQueryData<InfiniteData<EmailsResponse>>(["emails"], (oldData) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                    ...page,
                    emails: page.emails.map((email) => {
                        if (selectedEmails.has(email.id)) {
                            const newLabelIds = [...(email.labelIds || [])];
                            if (!newLabelIds.includes("STARRED")) {
                                newLabelIds.push("STARRED");
                            }
                            return {
                                ...email,
                                labelIds: newLabelIds,
                            };
                        }
                        return email;
                    }),
                })),
            };
        });

        // Show immediate success toast
        toast.success(`${selectedEmails.size} emails starred`);

        // Clear selections immediately for better UX
        clearSelections();

        // Then make API call in the background
        try {
            await apiauth.post("/gmail/star", {
                message_ids: Array.from(selectedEmails),
            });
        } catch (error) {
            console.error("Failed to star emails:", error);
            toast.error("Failed to star emails");
            // Refresh data since we may have incomplete state
            queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
    };

    const bulkUnstarEmails = async () => {
        if (selectedEmails.size === 0) return;

        // First update UI optimistically
        queryClient.setQueryData<InfiniteData<EmailsResponse>>(["emails"], (oldData) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                    ...page,
                    emails: page.emails.map((email) => {
                        if (selectedEmails.has(email.id)) {
                            return {
                                ...email,
                                labelIds: (email.labelIds || []).filter(label => label !== "STARRED"),
                            };
                        }
                        return email;
                    }),
                })),
            };
        });

        // Show immediate success toast
        toast.success(`${selectedEmails.size} emails unstarred`);

        // Clear selections immediately for better UX
        clearSelections();

        // Then make API call in the background
        try {
            await apiauth.post("/gmail/unstar", {
                message_ids: Array.from(selectedEmails),
            });
        } catch (error) {
            console.error("Failed to unstar emails:", error);
            toast.error("Failed to unstar emails");
            // Refresh data since we may have incomplete state
            queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
    };

    const bulkArchiveEmails = async () => {
        if (selectedEmails.size === 0) return;

        // Store selected email IDs in a local variable before clearing the selection
        const emailIdsToArchive = Array.from(selectedEmails);

        // First update UI optimistically
        queryClient.setQueryData<InfiniteData<EmailsResponse>>(["emails"], (oldData) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                    ...page,
                    emails: page.emails.filter(email => !selectedEmails.has(email.id)),
                })),
            };
        });

        // Show immediate success toast
        toast.success(`${selectedEmails.size} emails archived`);

        // Clear selections immediately for better UX
        clearSelections();

        // Then make API call in the background
        try {
            await apiauth.post("/gmail/archive", {
                message_ids: emailIdsToArchive,
            });
        } catch (error) {
            console.error("Failed to archive emails:", error);
            toast.error("Failed to archive emails");
            // Refresh data since we may have incomplete state
            queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
    };

    const bulkTrashEmails = async () => {
        if (selectedEmails.size === 0) return;

        // Store selected email IDs in a local variable before clearing the selection
        const emailIdsToTrash = Array.from(selectedEmails);

        // First update UI optimistically
        queryClient.setQueryData<InfiniteData<EmailsResponse>>(["emails"], (oldData) => {
            if (!oldData) return oldData;

            return {
                ...oldData,
                pages: oldData.pages.map((page) => ({
                    ...page,
                    emails: page.emails.filter(email => !selectedEmails.has(email.id)),
                })),
            };
        });

        // Show immediate success toast
        toast.success(`${selectedEmails.size} emails moved to trash`);

        // Clear selections immediately for better UX
        clearSelections();

        // Then make API call in the background
        try {
            await apiauth.post("/gmail/trash", {
                message_ids: emailIdsToTrash,
            });
        } catch (error) {
            console.error("Failed to trash emails:", error);
            toast.error("Failed to move emails to trash");
            // Refresh data since we may have incomplete state
            queryClient.invalidateQueries({ queryKey: ["emails"] });
        }
    };

    return {
        selectedEmails,
        toggleEmailSelection,
        clearSelections,
        bulkMarkAsRead,
        bulkMarkAsUnread,
        bulkStarEmails,
        bulkUnstarEmails,
        bulkArchiveEmails,
        bulkTrashEmails
    };
};