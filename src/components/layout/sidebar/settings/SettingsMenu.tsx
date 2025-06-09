import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import { useRouter } from "next/navigation";
import React, { useState } from "react";
import { useDispatch } from "react-redux";
import { toast } from "sonner";

import {
  Logout02Icon,
  Settings01Icon,
  ThreeDotsMenu,
} from "@/components/shared/icons";
import { authApi } from "@/features/auth/api/authApi";
import { useUserActions } from "@/features/auth/hooks/useUser";
import { chatApi } from "@/features/chat/api/chatApi";
import { useConversation } from "@/features/chat/hooks/useConversation";
import { useFetchConversations } from "@/features/chat/hooks/useConversationList";
import { clearConversations } from "@/redux/slices/conversationsSlice";

// Only allow these values in our modal state.
export type ModalAction = "clear_chats" | "logout";

interface MenuItem {
  key: string;
  label: React.ReactNode;
  color?: "danger";
  action?: () => void;
}

export default function SettingsMenu() {
  const { clearUser } = useUserActions();
  const router = useRouter();
  const dispatch = useDispatch();
  const fetchConversations = useFetchConversations();
  const { updateConvoMessages } = useConversation();
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);
  // either "clear_chats", "logout", or null (closed)

  // Confirm logout action.
  const handleConfirmLogout = async () => {
    try {
      await authApi.logout();
      clearUser();
      toast.success("Successfully logged out!");
    } catch (error) {
      toast.error("Could not log out. Please try again.");
      console.error("Error during logout:", error);
    } finally {
      setModalAction(null);
      router.push("/login");
    }
  };

  // Confirm clear chats action.
  const handleConfirmClearChats = async () => {
    try {
      router.push("/c");

      await chatApi.deleteAllConversations();

      // Clear conversations in Redux state immediately
      dispatch(clearConversations());

      // Then fetch from the API to ensure sync with server
      await fetchConversations(1, 20, false);

      updateConvoMessages([]);
      // Toast is already shown by the API service
    } catch (error) {
      // Error toast is already shown by the API service
      console.error("Error clearing chats:", error);
    } finally {
      setModalAction(null);
    }
  };

  const items: MenuItem[] = [
    {
      key: "settings",
      label: (
        <div className="flex items-center gap-4">
          <Settings01Icon color="text-foreground" width={20} />
          Settings
        </div>
      ),
      action: () => router.push("/settings"),
    },
    {
      key: "logout",
      label: (
        <div className="flex items-center gap-4">
          <Logout02Icon color={undefined} width={20} />
          Logout
        </div>
      ),
      action: () => setModalAction("logout"),
      color: "danger",
    },
  ];

  return (
    <>
      <Modal
        isOpen={modalAction !== null}
        backdrop="blur"
        onOpenChange={() => setModalAction(null)}
      >
        <ModalContent>
          <>
            <ModalHeader className="flex justify-center">
              {modalAction === "logout"
                ? "Are you sure you want to logout?"
                : "Are you sure you want to delete all chats?"}
            </ModalHeader>
            <ModalBody className="mb-4 flex flex-col gap-2">
              <Button
                color="danger"
                radius="full"
                onPress={() => {
                  if (modalAction === "logout") {
                    handleConfirmLogout();
                  } else if (modalAction === "clear_chats") {
                    handleConfirmClearChats();
                  }
                }}
              >
                {modalAction === "logout" ? "Logout" : "Delete all chats"}
              </Button>
              <Button
                radius="full"
                variant="bordered"
                onPress={() => setModalAction(null)}
              >
                Cancel
              </Button>
            </ModalBody>
          </>
        </ModalContent>
      </Modal>

      <Dropdown className="text-foreground dark">
        <DropdownTrigger>
          <Button isIconOnly aria-label="Three Dots Menu" variant="light">
            <ThreeDotsMenu />
          </Button>
        </DropdownTrigger>
        <DropdownMenu aria-label="Dynamic Actions">
          {items.map((item) => (
            <DropdownItem
              key={item.key}
              className={item.color === "danger" ? "text-danger" : ""}
              color={item.color === "danger" ? "danger" : "default"}
              textValue={item.key}
              onPress={item.action}
            >
              {item.label}
            </DropdownItem>
          ))}
        </DropdownMenu>
      </Dropdown>
    </>
  );
}
