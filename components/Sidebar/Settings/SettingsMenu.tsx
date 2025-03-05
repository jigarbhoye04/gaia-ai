import { Button } from "@heroui/button";
import {
  Dropdown,
  DropdownItem,
  DropdownMenu,
  DropdownTrigger,
} from "@heroui/dropdown";
import { Modal, ModalBody, ModalContent, ModalHeader } from "@heroui/modal";
import React, { useState } from "react";
import { useRouter } from "next/navigation";

import { Logout02Icon, Settings01Icon, ThreeDotsMenu } from "../../Misc/icons";

import SettingsModal from "./SettingsModal";

import { useConversationList } from "@/contexts/ConversationList";
import { useConvo } from "@/contexts/CurrentConvoMessages";
import { useUser } from "@/contexts/UserContext";
import { ApiService } from "@/utils/chatUtils";

// Only allow these values in our modal state.
export type ModalAction = "clear_chats" | "logout";

interface MenuItem {
  key: string;
  label: React.ReactNode;
  color?: "danger";
  action?: () => void;
}

export default function SettingsMenu() {
  const { logout } = useUser();
  const router = useRouter();
  const { fetchConversations } = useConversationList();
  const { setConvoMessages } = useConvo();
  const [openSettings, setOpenSettings] = useState(false);

  // modalAction is either "clear_chats", "logout", or null (closed)
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);

  // Confirm logout action.
  const handleConfirmLogout = () => {
    logout();
    setModalAction(null);
  };

  // Confirm clear chats action.
  const handleConfirmClearChats = async () => {
    router.push("/c");
    await ApiService.deleteAllConversations();
    await fetchConversations();
    setConvoMessages([]);
    setModalAction(null);
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
      action: () => setOpenSettings(true),
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
      <SettingsModal
        openSettings={openSettings}
        setModalAction={setModalAction}
        setOpenSettings={setOpenSettings}
      />

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
            <ModalBody className="flex flex-col gap-2 mb-4">
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

      <Dropdown className="dark text-foreground">
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
