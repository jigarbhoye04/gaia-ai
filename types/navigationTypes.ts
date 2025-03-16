// Navigation-related types
import { ReactNode } from "react";

// Navbar component types
export interface NavbarProps {
  scrolled?: boolean;
  transparent?: boolean;
}

export interface NavLinkProps {
  href: string;
  label: string;
  icon?: ReactNode;
  external?: boolean;
}

export interface DesktopMenuProps {
  scrolled: boolean;
}

export interface MobileMenuProps {
  pages: NavLinkProps[];
}

// Footer component types
export interface FooterProps {
  className?: string;
}

export interface LinkButtonProps {
  href: string;
  children: ReactNode;
  className?: string;
  target?: "_blank" | "_self";
}