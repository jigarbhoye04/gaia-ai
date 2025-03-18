import { Switch } from "@heroui/switch";

import { cn } from "@/lib/utils";

export default function PrivacySection() {
  return (
    <div className="flex flex-col gap-2">
      <h3 className="mb-3">Privacy</h3>

      <div className="flex justify-between items-center">
        <Switch
          classNames={{
            base: cn(
              "inline-flex flex-row-reverse min-w-full bg-content1 hover:bg-content2 items-center transition-all",
              "justify-between cursor-pointer rounded-lg gap-2 p-2 border-2 border-transparent",
              "data-[selected=true]:border-primary",
            ),
          }}
          disabled={true}
          isSelected={false}
        >
          <div className=" !text-foreground-400">
            Switch on end-to-end Encryption for all chats?
          </div>
        </Switch>
      </div>
    </div>
  );
}
