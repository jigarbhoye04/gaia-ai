import { Camera, Edit3, LogOut, Mail, User } from "lucide-react";
import React, { useRef, useState } from "react";
import { toast } from "sonner";

import { authApi } from "@/features/auth/api/authApi";
import { useUser, useUserActions } from "@/features/auth/hooks/useUser";

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
      toast.loading("Updating name...", { id: "update-name" });

      const formData = new FormData();
      if (editedName !== user?.name) {
        formData.append("name", editedName);
      }

      const response = await authApi.updateProfile(formData);

      updateUser({
        name: response.name,
        email: response.email,
        profilePicture: response.picture,
      });

      toast.success("Name updated successfully!", { id: "update-name" });
      setIsEditing(false);
    } catch (error) {
      console.error("Profile update error:", error);
      toast.error("Failed to update name", { id: "update-name" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsLoading(true);
      toast.loading("Uploading profile picture...", { id: "update-picture" });

      const formData = new FormData();
      formData.append("picture", file);

      const response = await authApi.updateProfile(formData);

      updateUser({
        name: response.name,
        email: response.email,
        profilePicture: response.picture,
      });

      toast.success("Profile picture updated successfully!", {
        id: "update-picture",
      });
    } catch (error) {
      console.error("Profile picture update error:", error);
      toast.error("Failed to update profile picture", { id: "update-picture" });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Profile Section */}
      <div className="rounded-2xl bg-zinc-900 p-6">
        <div className="mb-6 flex items-center space-x-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-blue-500/10">
            <User className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h3 className="font-medium text-white">Profile</h3>
            <p className="text-sm text-zinc-400">
              Manage your account profile and personal information
            </p>
          </div>
        </div>
        <div className="flex items-start space-x-6">
          {/* Avatar */}
          <div className="group relative">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isLoading}
              className="relative h-20 w-20 overflow-hidden rounded-full bg-zinc-800 transition-all duration-200 hover:ring-2 hover:ring-blue-500 hover:ring-offset-2 hover:ring-offset-zinc-900"
            >
              {user?.profilePicture ? (
                <img
                  src={user.profilePicture}
                  alt={user?.name || "Profile"}
                  className="h-full w-full object-cover"
                />
              ) : (
                <div className="flex h-full w-full items-center justify-center">
                  <User className="h-8 w-8 text-zinc-400" />
                </div>
              )}
              <div className="bg-opacity-50 absolute inset-0 flex items-center justify-center bg-black opacity-0 transition-opacity duration-200 group-hover:opacity-100">
                <Camera className="h-6 w-6 text-white" />
              </div>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleImageChange}
              className="hidden"
            />
          </div>

          {/* User Info */}
          <div className="flex-1 space-y-4">
            {/* Name */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Name</label>
              {isEditing ? (
                <div className="space-y-3">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="w-full rounded-2xl bg-zinc-800 px-4 py-3 text-white placeholder-zinc-400 focus:bg-zinc-700 focus:ring-2 focus:ring-blue-500 focus:outline-none"
                    placeholder="Enter your name"
                  />
                  <div className="flex items-center space-x-3">
                    <button
                      onClick={handleSave}
                      disabled={isLoading}
                      className="flex-1 rounded-2xl bg-blue-500 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-blue-600 disabled:opacity-50"
                    >
                      {isLoading ? "Saving..." : "Save Changes"}
                    </button>
                    <button
                      onClick={() => {
                        setIsEditing(false);
                        setEditedName(user?.name || "");
                      }}
                      className="flex-1 rounded-2xl bg-zinc-700 px-4 py-2.5 text-sm font-medium text-white transition-colors duration-200 hover:bg-zinc-600"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setIsEditing(true)}
                  className="group flex w-full items-center justify-between rounded-2xl bg-zinc-800 px-4 py-3 text-white transition-colors duration-200 hover:bg-zinc-700"
                >
                  <span>{user?.name || "Loading..."}</span>
                  <Edit3 className="h-4 w-4 text-zinc-400 transition-colors duration-200 group-hover:text-white" />
                </button>
              )}
            </div>

            {/* Email */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-zinc-300">Email</label>
              <div className="flex items-center space-x-3">
                <Mail className="h-4 w-4 text-zinc-400" />
                <span className="text-white">
                  {user?.email || "Loading..."}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Logout Section */}
      <div className="rounded-2xl bg-zinc-900 p-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10">
              <LogOut className="h-5 w-5 text-red-400" />
            </div>
            <div>
              <h3 className="font-medium text-white">Sign Out</h3>
              <p className="text-sm text-zinc-400">
                Sign out of your account on this device
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAction("logout")}
            className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/20"
          >
            Sign Out
          </button>
        </div>
      </div>
    </div>
  );
}
