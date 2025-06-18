import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";

import { ContactSupportModal } from "@/features/support";

export default function ContactSupport() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <div>
        <Button
          variant="flat"
          className="h-fit w-full rounded-2xl"
          onPress={onOpen}
        >
          <div className="flex items-center gap-4">
            <div className="flex w-full flex-col justify-center py-3">
              <div className="text-left text-sm font-medium">
                Contact Support
              </div>
              <div className="line-clamp-2 text-left text-xs text-wrap text-foreground-500">
                Need help or wish a feature existed?
              </div>
            </div>
          </div>
        </Button>
      </div>

      <ContactSupportModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </>
  );
}
