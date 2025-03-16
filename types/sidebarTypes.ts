// Types related to sidebar components
import { ReactNode } from "react";

// ChatOptionsDropdown component types
export interface ChatOptionsDropdownProps {
  buttonHovered: boolean;
  chatId: string;
  chatName: string;
  starred: boolean;
  logo2?: boolean;
  btnChildren?: ReactNode;
}

// ChatTab component types
export interface ChatTabProps {
  name: string;
  id: string;
  starred: boolean;
}

// SidebarLayout component types
export interface SidebarLayoutProps {
  sidebarref: React.LegacyRef<HTMLDivElement>;
  toggleSidebar: () => void;
  className?: string;
  isSidebarVisible: boolean;
  children: ReactNode;
}

// SettingsMenu component types
export type ModalAction = "clear_chats" | "logout";

export interface MenuItem {
  key: string;
  label: React.ReactNode;
  color?: "danger";
  action?: () => void;
}