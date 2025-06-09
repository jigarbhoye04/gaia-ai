import { Trash2 } from "lucide-react";
import React from "react";

import { ModalAction } from "./SettingsMenu";

export default function GeneralSection({
  setModalAction,
}: {
  setModalAction: React.Dispatch<React.SetStateAction<ModalAction | null>>;
}) {
  return (
    <div className="w-full space-y-6">
      {/* Clear Chats Card */}
      <div className="rounded-2xl bg-zinc-900 p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-red-500/10">
              <Trash2 className="h-5 w-5 text-red-400" />
            </div>
            <div className="space-y-1">
              <h3 className="font-medium text-white">Clear Chat History</h3>
              <p className="text-sm text-zinc-400">
                Permanently delete all your conversations and chat history
              </p>
            </div>
          </div>
          <button
            onClick={() => setModalAction("clear_chats")}
            className="rounded-lg bg-red-500/10 px-4 py-2 text-sm font-medium text-red-400 transition-colors duration-200 hover:bg-red-500/20"
          >
            Clear All
          </button>
        </div>
      </div>
    </div>
  );
}
