import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";

import { CustomerService01Icon } from "@/components/shared/icons";
import { ContactSupportModal } from "@/features/support";

export default function ContactSupport() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Button
        variant="flat"
        className="flex h-fit w-full gap-3"
        onPress={onOpen}
      >
        <CustomerService01Icon width={23} height={23} color={undefined} />
        <div className="flex items-center gap-3">
          <div className="flex w-full flex-col justify-center py-2">
            <div className="text-left text-sm font-medium">Contact Support</div>
            <div className="line-clamp-2 text-left text-xs text-wrap text-foreground-400">
              Need help or wish a feature existed?
            </div>
          </div>
        </div>
      </Button>

      <ContactSupportModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </>
  );
}
