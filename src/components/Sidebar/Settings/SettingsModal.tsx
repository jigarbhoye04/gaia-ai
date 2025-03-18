import { Button } from "@heroui/button";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";
import React, { useState } from "react";

import PrivacySection from "./PrivacySettings";
import GeneralSection from "./GeneralSettings";
// import AccountSection from "./AccountSettings";
import { ModalAction } from "./SettingsMenu";

interface SidebarItem {
  key: string;
  label: string;
}

const sidebarItems: SidebarItem[] = [
  { key: "general", label: "General" },
  { key: "privacy", label: "Privacy" },
  { key: "account", label: "Account" },
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
  const [activeSection, setActiveSection] = useState("general");

  // Render the main content based on the active section.
  const renderSectionContent = () => {
    switch (activeSection) {
      case "general":
        return <GeneralSection setModalAction={setModalAction} />;
      case "privacy":
        return <PrivacySection />;
      // case "account":
      //   return <AccountSection setModalAction={setModalAction} />;
      default:
        return null;
    }
  };

  return (
    <Modal backdrop="blur" isOpen={openSettings} onOpenChange={setOpenSettings}>
      <ModalContent className="min-h-[400px] max-w-4xl">
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
