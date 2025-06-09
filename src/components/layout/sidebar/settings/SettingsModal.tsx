import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";
import React, { useState } from "react";

import AccountSection from "./AccountSettings";
import GeneralSection from "./GeneralSettings";
import MemorySettings from "./MemorySettings";
import PreferencesSettings from "./PreferencesSettings";
import { ModalAction } from "./SettingsMenu";

interface SidebarItem {
  key: string;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { key: "account", label: "Account" },
  { key: "preferences", label: "Preferences" },
  { key: "chats", label: "Chats" },
  { key: "memory", label: "Memory" },
];

export default function SettingsModal({
  openSettings,
  setOpenSettings,
  setModalAction,
}: {
  openSettings: boolean;
  setOpenSettings: React.Dispatch<React.SetStateAction<boolean>>;
  setModalAction: React.Dispatch<React.SetStateAction<ModalAction | null>>;
}) {
  const [activeSection, setActiveSection] = useState("account");

  // Render the main content based on the active section.
  const renderSectionContent = () => {
    switch (activeSection) {
      case "account":
        return <AccountSection setModalAction={setModalAction} />;
      case "preferences":
        return <PreferencesSettings />;
      case "chats":
        return <GeneralSection setModalAction={setModalAction} />;
      case "memory":
        return <MemorySettings />;
      default:
        return null;
    }
  };

  return (
    <Modal backdrop="blur" isOpen={openSettings} onOpenChange={setOpenSettings}>
      <ModalContent className="min-h-[500px] max-w-4xl">
        <ModalBody className="flex flex-row p-5">
          <div className="w-1/4 border-r border-r-[#ffffff20] pr-4">
            <ul className="space-y-1">
              {sidebarItems.map((item) => (
                <li key={item.key}>
                  <Button
                    className="w-full justify-start"
                    radius="sm"
                    variant={activeSection === item.key ? "solid" : "light"}
                    onPress={() => setActiveSection(item.key)}
                  >
                    {item.label}
                  </Button>
                </li>
              ))}
            </ul>
          </div>
          <div className="w-3/4 pl-4">{renderSectionContent()}</div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
