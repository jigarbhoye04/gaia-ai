import useMediaQuery from "@/hooks/useMediaQuery";

import { Menu02Icon, SidebarLeftIcon } from "../Misc/icons";
import { Button } from "../ui/button";

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
      className={`group rounded-lg text-foreground-700 hover:bg-primary ${
        isSidebarVisible ? "sm:opacity-0" : "sm:opacity-100"
      }`}
      size="icon"
      variant={"ghost"}
      onClick={toggleSidebar}
    >
      {isMobileScreen ? (
        <Menu02Icon
          className="transition-all group-hover:text-white"
          height="24"
          color={undefined}
        />
      ) : (
        <SidebarLeftIcon
          className="transition-all group-hover:text-white"
          height="24"
          color={undefined}
        />
      )}
    </Button>
  );
}

export default CloseOpenSidebarBtn;
