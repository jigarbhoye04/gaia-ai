import { Button } from "@heroui/button";
import { useDisclosure } from "@heroui/modal";
import { Tooltip } from "@heroui/react";

import { CustomerService01Icon } from "@/components/shared/icons";
import { ContactSupportModal } from "@/features/support";

export default function ContactSupport() {
  const { isOpen, onOpen, onOpenChange } = useDisclosure();

  return (
    <>
      <Tooltip content="Contact Support or Request a Feature">
        <Button
          variant="flat"
          className="flex h-fit w-full gap-2"
          onPress={onOpen}
        >
          <CustomerService01Icon width={23} height={23} color={undefined} />
          <div className="w-full py-2 text-left text-sm font-medium text-wrap">
            Need help or improvements?
          </div>
        </Button>
      </Tooltip>

      <ContactSupportModal isOpen={isOpen} onOpenChange={onOpenChange} />
    </>
  );
}
