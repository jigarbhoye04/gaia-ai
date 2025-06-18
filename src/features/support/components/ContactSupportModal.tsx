import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Select, SelectItem } from "@heroui/select";

import {
  FORM_VALIDATION,
  SUPPORT_REQUEST_TYPE_LABELS,
  SUPPORT_REQUEST_TYPES,
} from "../constants/supportConstants";
import { useContactSupport } from "../hooks/useContactSupport";

interface ContactSupportModalProps {
  isOpen: boolean;
  onOpenChange: () => void;
}

export default function ContactSupportModal({
  isOpen,
  onOpenChange,
}: ContactSupportModalProps) {
  const {
    formData,
    isSubmitting,
    isFormValid,
    handleInputChange,
    submitRequest,
    resetForm,
  } = useContactSupport();

  const handleSubmit = async () => {
    const success = await submitRequest();
    if (success) {
      onOpenChange();
    }
  };

  const handleClose = () => {
    resetForm();
    onOpenChange();
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onOpenChange} size="2xl">
      <ModalContent>
        {() => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Contact Support
            </ModalHeader>
            <ModalBody className="gap-4">
              <Select
                label="Request Type"
                placeholder="Select a request type"
                selectedKeys={formData.type ? [formData.type] : []}
                onSelectionChange={(keys) => {
                  const selectedKey = Array.from(keys)[0] as string;
                  handleInputChange("type", selectedKey);
                }}
                isRequired
              >
                <SelectItem key={SUPPORT_REQUEST_TYPES.SUPPORT}>
                  {SUPPORT_REQUEST_TYPE_LABELS[SUPPORT_REQUEST_TYPES.SUPPORT]}
                </SelectItem>
                <SelectItem key={SUPPORT_REQUEST_TYPES.FEATURE}>
                  {SUPPORT_REQUEST_TYPE_LABELS[SUPPORT_REQUEST_TYPES.FEATURE]}
                </SelectItem>
              </Select>

              <Input
                label="Title"
                placeholder="Brief description of your request"
                value={formData.title}
                onValueChange={(value) => handleInputChange("title", value)}
                maxLength={FORM_VALIDATION.MAX_TITLE_LENGTH}
                isRequired
              />

              <Textarea
                label="Description"
                placeholder="Please provide detailed information about your request..."
                value={formData.description}
                onValueChange={(value) =>
                  handleInputChange("description", value)
                }
                minRows={6}
                maxRows={10}
                maxLength={FORM_VALIDATION.MAX_DESCRIPTION_LENGTH}
                isRequired
              />
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={handleClose}>
                Cancel
              </Button>
              <Button
                color="primary"
                onPress={handleSubmit}
                isLoading={isSubmitting}
                isDisabled={!isFormValid}
              >
                Submit Request
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
