import { useUser } from "@/contexts/UserContext";
import { User } from "@heroui/user";
import SettingsMenu from "./Settings/SettingsMenu";
// import { Spinner } from "@heroui/spinner";

export default function UserContainer() {
  const { user } = useUser();

  return (
    <div className="justify-center flex w-full p-4 bg-black flex-col gap-3">
      {/* <div className="flex relative py-3 px-3 justify-between items-center hover:bg-zinc-900 rounded-xl transition-all bg-black">
      Syncing...
      <Spinner size="sm" />
      <div className="absolute h-[2px] bottom-2 left-3 w-1/3 bg-[#00bbff]" />
    </div> */}

      <div className="user_container_inner">
        <User
          avatarProps={{
            src: user?.profile_picture,
            showFallback: true,
            isBordered: true,
            fallback: (
              <img
                alt={"User Profile photo"}
                className="min-h-[35px] min-w-[35px]"
                src="https://links.aryanranderiya.com/l/default_user"
              />
            ),
            size: "sm",
            className: "min-w-[30px]",
          }}
          className="text-nowrap"
          name={`${user?.name}`}
        />

        <SettingsMenu />
      </div>
    </div>
  );
}
