"use client";

import { useSearchParams } from "next/navigation";
import { useState } from "react";

import AccountSettings from "@/components/layout/sidebar/settings/AccountSettings";
import GeneralSettings from "@/components/layout/sidebar/settings/GeneralSettings";
import LogoutModal from "@/components/layout/sidebar/settings/LogoutModal";
import MemorySettings from "@/components/layout/sidebar/settings/MemorySettings";
import PreferencesSettings from "@/components/layout/sidebar/settings/PreferencesSettings";
import { ModalAction } from "@/components/layout/sidebar/settings/SettingsMenu";

export default function SettingsPage() {
  const searchParams = useSearchParams();
  const section = searchParams.get("section") || "general";
  const [modalAction, setModalAction] = useState<ModalAction | null>(null);

  const renderContent = () => {
    switch (section) {
      case "account":
        return <AccountSettings setModalAction={setModalAction} />;
      case "preferences":
        return <PreferencesSettings />;
      case "memory":
        return <MemorySettings />;
      case "general":
      default:
        return <GeneralSettings setModalAction={setModalAction} />;
    }
  };

  return (
    <>
      <div className="flex h-full w-full flex-col">
        <div className="flex-1 overflow-y-auto">
          <div className="flex w-full justify-center p-6">
            <div className="w-full max-w-2xl">{renderContent()}</div>
          </div>
        </div>
      </div>

      <LogoutModal modalAction={modalAction} setModalAction={setModalAction} />
    </>
  );
}
