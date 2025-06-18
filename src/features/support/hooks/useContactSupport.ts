import { useState } from "react";
import { toast } from "sonner";

import { supportApi, type SupportRequest } from "../api/supportApi";
import { FORM_VALIDATION, TOAST_MESSAGES } from "../constants/supportConstants";

export interface ContactFormData {
  type: string;
  title: string;
  description: string;
}

export function useContactSupport() {
  const [formData, setFormData] = useState<ContactFormData>({
    type: "",
    title: "",
    description: "",
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof ContactFormData, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const resetForm = () => {
    setFormData({
      type: "",
      title: "",
      description: "",
    });
  };

  const validateForm = (): boolean => {
    if (!formData.type || !formData.title || !formData.description) {
      toast.error(TOAST_MESSAGES.VALIDATION_ERROR);
      return false;
    }

    if (formData.title.trim().length < FORM_VALIDATION.MIN_TITLE_LENGTH) {
      toast.error(TOAST_MESSAGES.TITLE_TOO_SHORT);
      return false;
    }

    if (
      formData.description.trim().length <
      FORM_VALIDATION.MIN_DESCRIPTION_LENGTH
    ) {
      toast.error(TOAST_MESSAGES.DESCRIPTION_TOO_SHORT);
      return false;
    }

    return true;
  };

  const submitRequest = async (): Promise<boolean> => {
    if (!validateForm()) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const requestData: SupportRequest = {
        type: formData.type as "support" | "feature",
        title: formData.title.trim(),
        description: formData.description.trim(),
      };

      const response = await supportApi.submitRequest(requestData);

      if (response.success) {
        const successMessage = response.ticket_id
          ? `${TOAST_MESSAGES.SUCCESS} Ticket ID: ${response.ticket_id}`
          : TOAST_MESSAGES.SUCCESS;
        toast.success(successMessage);
        resetForm();
        return true;
      } else {
        toast.error(response.message || TOAST_MESSAGES.GENERIC_ERROR);
        return false;
      }
    } catch (error) {
      console.error("Error submitting support request:", error);
      toast.error(TOAST_MESSAGES.GENERIC_ERROR);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  const isFormValid = formData.type && formData.title && formData.description;

  return {
    formData,
    isSubmitting,
    isFormValid,
    handleInputChange,
    submitRequest,
    resetForm,
  };
}
