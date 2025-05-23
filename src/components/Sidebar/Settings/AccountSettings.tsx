import { Avatar } from "@heroui/avatar";
import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { useUser, useUserActions } from "@/hooks/useUser";
import { apiauth } from "@/utils/apiaxios";

import {
  Logout02Icon,
  Mail01Icon,
  PencilEdit02Icon,
  UserIcon,
} from "../../Misc/icons";
import { ModalAction } from "./SettingsMenu";

export default function AccountSection({
  setModalAction,
}: {
  setModalAction: React.Dispatch<React.SetStateAction<ModalAction | null>>;
}) {
  const user = useUser();
  const { updateUser } = useUserActions();
  const [isEditing, setIsEditing] = useState(false);
  const [editedName, setEditedName] = useState(user?.name || "");
  const [isLoading, setIsLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleSave = async () => {
    try {
      setIsLoading(true);
      const formData = new FormData();
      if (editedName !== user?.name) {
        formData.append("name", editedName);
      }

      const response = await apiauth.patch("/oauth/me", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      updateUser({
        name: response.data.name,
        email: response.data.email,
        profilePicture: response.data.picture,
      });

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      toast.error("Failed to update profile");
      console.error("Profile update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      const formData = new FormData();
      formData.append("picture", file);

      const response = await apiauth.patch("/oauth/me", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        withCredentials: true,
      });

      updateUser({
        name: response.data.name,
        email: response.data.email,
        profilePicture: response.data.picture,
      });

      toast.success("Profile picture updated successfully");
    } catch (error) {
      toast.error("Failed to update profile picture");
      console.error("Profile picture update error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-full flex-col gap-2">
      <h3 className="mb-3">Account</h3>

      <div className="flex w-full items-center justify-between gap-5">
        <div className="flex w-full flex-col gap-2 rounded-2xl bg-black/40 p-3">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Mail01Icon className="text-foreground-300" />
            </div>
            <div className="flex items-center gap-3 text-foreground-500">
              {user?.email || "Loading..."}
            </div>
          </div>
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <UserIcon className="text-foreground-300" />
            </div>
            {isEditing ? (
              <div className="flex items-center gap-2">
                <Input
                  size="sm"
                  value={editedName}
                  onChange={(e) => setEditedName(e.target.value)}
                  className="max-w-[200px]"
                  variant="bordered"
                />
                <Button
                  size="sm"
                  color="primary"
                  onPress={handleSave}
                  isLoading={isLoading}
                >
                  Save
                </Button>
                <Button
                  size="sm"
                  variant="flat"
                  onPress={() => {
                    setIsEditing(false);
                    setEditedName(user?.name || "");
                  }}
                >
                  Cancel
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-foreground-500">
                  {user?.name || "Not set"}
                </span>
                <Button
                  size="sm"
                  variant="light"
                  isIconOnly
                  onPress={() => setIsEditing(true)}
                >
                  <PencilEdit02Icon className="h-4 w-4" />
                </Button>
              </div>
            )}
          </div>
        </div>

        <div className="flex h-[86px] items-center gap-3 rounded-2xl bg-black/40 p-3">
          <Avatar
            className="aspect-square"
            size="lg"
            
            src={
              user?.profilePicture ||
              "https://links.aryanranderiya.com/l/default_user"
            }
          />

          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png,image/gif,image/webp"
            onChange={handleImageChange}
            className="hidden"
          />
          <Button
            size="sm"
            variant="flat"
            onPress={() => fileInputRef.current?.click()}
            isLoading={isLoading}
          >
            Change image
          </Button>
        </div>
      </div>

      <div className="mt-auto flex items-center justify-between">
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
