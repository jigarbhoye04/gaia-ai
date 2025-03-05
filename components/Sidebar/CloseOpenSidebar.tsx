import { Menu02Icon, SidebarLeftIcon } from "../Misc/icons";
import { Button } from "../ui/button";

import useMediaQuery from "@/hooks/mediaQuery";

export interface CloseOpenSidebarBtnProps {
  isSidebarVisible?: boolean;
  toggleSidebar: () => void;
}

function CloseOpenSidebarBtn({
  toggleSidebar,
  isSidebarVisible = false,
}: CloseOpenSidebarBtnProps) {
  const isMobileScreen: boolean = useMediaQuery("(max-width: 600px)");

  return (
    <Button
      aria-label="Open Menu"
      className={`rounded-lg group hover:bg-primary ${
        isSidebarVisible ? "sm:opacity-0" : "sm:opacity-100"
      }`}
      size="icon"
      variant={isMobileScreen ? "default" : "ghost"}
      onClick={toggleSidebar}
    >
      {isMobileScreen ? (
        <Menu02Icon
          className="group-hover:text-white transition-all"
          height="24"
        />
      ) : (
        <SidebarLeftIcon
          className="group-hover:text-white transition-all"
          height="24"
        />
      )}
    </Button>
  );
}

export default CloseOpenSidebarBtn;
