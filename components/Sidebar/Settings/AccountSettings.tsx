import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import React from "react";

import { Logout02Icon, Mail01Icon, UserIcon } from "../../Misc/icons";

import { ModalAction } from "./SettingsMenu";

export default function AccountSection({
  setModalAction,
}: {
  setModalAction: React.Dispatch<React.SetStateAction<ModalAction | null>>;
}) {
  return (
    <div className="flex flex-col gap-2 min-h-full">
      <h3 className="mb-3">Account</h3>

      <div className="flex w-full justify-between items-center gap-5">
        <div className="flex flex-col w-full bg-black/40 p-3 gap-2 rounded-2xl">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <Mail01Icon className="text-foreground-300" />
              Email
            </div>
            <div className="flex items-center gap-3  text-foreground-500">
              user@gmail.com
            </div>
          </div>
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <UserIcon className="text-foreground-300" />
              Name
            </div>
            <div className="flex items-center gap-3 text-foreground-500 text-left">
              lorem ipsum
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3 bg-black/40 p-3 rounded-2xl">
          <Avatar
            className="aspect-square"
            size="lg"
            src="https://github.com/aryanranderiya.png"
          />

          <Button size="sm" variant="flat">
            Change image
          </Button>
        </div>
      </div>

      <div className="flex justify-between items-center mt-auto">
        <div className="flex items-center gap-3">
          <Logout02Icon className="text-foreground-300" color={undefined} />
          Logout
        </div>
        <Button
          className="w-1/5"
          color="danger"
          radius="sm"
          variant="flat"
          onPress={() => setModalAction("logout")}
        >
          Logout
        </Button>
      </div>
    </div>
  );
}
