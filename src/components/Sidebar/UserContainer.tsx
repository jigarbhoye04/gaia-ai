import { User } from "@heroui/user";

import { useUser } from "@/hooks/useUser";

import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import SettingsMenu from "./Settings/SettingsMenu";
// import { Spinner } from "@heroui/spinner";

export default function UserContainer() {
  const user = useUser();

  return (
    <div className="relative z-[2] flex w-full flex-col justify-center gap-3 bg-black px-2 py-2">
      {/* <div className="flex relative py-3 px-3 justify-between items-center hover:bg-zinc-900 rounded-xl transition-all bg-black">
      Syncing...
      <Spinner size="sm" />
      <div className="absolute h-[2px] bottom-2 left-3 w-1/3 bg-[#00bbff]" />
    </div> */}

      <div className="user_container_inner">
        <div className="flex items-center gap-2">
          {/* <User
          avatarProps={{
            src: user?.profilePicture,

            // showFallback: !user?.profilePicture,
            isBordered: true,
            // fallback: (
            //   <img
            //     alt={"User Profile photo"}
            //     className="min-h-[35px] min-w-[35px]"
            //     src="https://links.aryanranderiya.com/l/default_user"
            //   />
            // ),
            size: "sm",
            className: "min-w-[30px]",
          }}
          className="text-nowrap"
          name={``} */}
          {/* /> */}
          <Avatar className="size-9 rounded-full border-2 border-black outline outline-zinc-700">
            <AvatarImage
              src={
                user?.profilePicture ||
                "https://links.aryanranderiya.com/l/default_user"
              }
              alt="Avatar"
            />
            <AvatarFallback>CN</AvatarFallback>
          </Avatar>
          <span>{user?.name}</span>
        </div>

        <SettingsMenu />
      </div>
    </div>
  );
}
