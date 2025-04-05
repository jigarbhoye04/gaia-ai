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
      className={`group mr-3 rounded-lg hover:bg-[#00bbff]/20 ${
        isSidebarVisible ? "sm:hidden sm:opacity-0" : "sm:flex sm:opacity-100"
      }`}
      size="icon"
      variant={"ghost"}
      onClick={toggleSidebar}
    >
      {isMobileScreen ? (
        <Menu02Icon
          className="text-zinc-400 transition-all group-hover:text-primary"
          height="24"
          color={undefined}
        />
      ) : (
        <SidebarLeftIcon
          className="text-zinc-400 transition-all group-hover:text-primary"
          height="24"
          color={undefined}
        />
      )}
    </Button>
  );
}

export default CloseOpenSidebarBtn;
