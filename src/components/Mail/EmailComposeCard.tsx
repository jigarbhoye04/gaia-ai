import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Edit, Mail, Send, User } from "lucide-react";
import React, { useState } from "react";
import { toast } from "sonner";
import { z } from "zod";

import { apiauth } from "@/utils/apiaxios";

// Email validation schema
const emailComposeSchema = z.object({
  to: z
    .array(z.string().email("Invalid email address"))
    .min(1, "At least one recipient is required"),
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(200, "Subject must be under 200 characters"),
  body: z
    .string()
    .min(1, "Email body is required")
    .max(10000, "Email body must be under 10,000 characters"),
});

interface EmailData {
  to: string[];
  subject: string;
  body: string;
}

interface EmailComposeCardProps {
  emailData: EmailData;
  onSent?: () => void;
}

export default function EmailComposeCard({
  emailData,
  onSent,
}: EmailComposeCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editData, setEditData] = useState<EmailData>(emailData);
  const [toInput, setToInput] = useState(emailData.to.join(", "));
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    try {
      const toEmails = toInput
        .split(",")
        .map((email) => email.trim())
        .filter((email) => email.length > 0);

      emailComposeSchema.parse({
        to: toEmails,
        subject: editData.subject,
        body: editData.body,
      });

      setErrors({});
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, string> = {};
        error.errors.forEach((err) => {
          if (err.path[0]) {
            newErrors[err.path[0].toString()] = err.message;
          }
        });
        setErrors(newErrors);
      }
      return false;
    }
  };

  const handleSend = async (dataToSend = emailData) => {
    setIsSending(true);
    try {
      await apiauth.post("/mail/send", {
        to: dataToSend.to,
        subject: dataToSend.subject,
        body: dataToSend.body,
      });

      toast.success("Email sent successfully! 📧");
      onSent?.();
    } catch (error) {
      console.error("Failed to send email:", error);
      toast.error("Failed to send email. Please try again.");
    } finally {
      setIsSending(false);
    }
  };

  const handleSave = () => {
    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    const toEmails = toInput
      .split(",")
      .map((email) => email.trim())
      .filter((email) => email.length > 0);

    const updatedData = {
      ...editData,
      to: toEmails,
    };

    setEditData(updatedData);
    setIsEditModalOpen(false);
    toast.success("Email updated successfully!");
  };

  const handleEditClick = () => {
    setToInput(editData.to.join(", "));
    setErrors({});
    setIsEditModalOpen(true);
  };

  return (
    <>
      {/* Main Email Card */}
      <div className="mx-auto w-full max-w-2xl overflow-hidden rounded-2xl border border-white/20 bg-white/95 shadow-lg backdrop-blur-sm">
        {/* Header */}
        <div className="border-b border-gray-100 bg-gradient-to-r from-blue-50 to-indigo-50 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-blue-100 p-2">
                <Mail className="h-5 w-5 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900">Draft Email</h3>
                <p className="text-sm text-gray-600">Ready to send</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                isIconOnly
                variant="light"
                size="sm"
                onPress={handleEditClick}
                className="text-gray-600 hover:text-gray-900"
              >
                <Edit className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-4 p-6">
          {/* Recipients */}
          <div className="flex items-start gap-3">
            <User className="mt-1 h-4 w-4 text-gray-500" />
            <div className="flex-1">
              <div className="mb-1 text-sm font-medium text-gray-700">To:</div>
              <div className="flex flex-wrap gap-1">
                {editData.to.map((email, index) => (
                  <span
                    key={index}
                    className="rounded-full bg-blue-100 px-2 py-1 text-sm text-blue-800"
                  >
                    {email}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Subject */}
          <div className="border-l-4 border-blue-200 pl-4">
            <div className="mb-1 text-sm font-medium text-gray-700">
              Subject:
            </div>
            <div className="font-medium text-gray-900">{editData.subject}</div>
          </div>

          {/* Body Preview */}
          <div className="border-l-4 border-gray-200 pl-4">
            <div className="mb-2 text-sm font-medium text-gray-700">
              Message:
            </div>
            <div className="max-h-32 overflow-y-auto text-sm leading-relaxed text-gray-800">
              {editData.body}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="border-t border-gray-100 bg-gray-50 px-6 py-4">
          <div className="flex justify-end">
            <Button
              color="primary"
              onPress={() => handleSend(editData)}
              isLoading={isSending}
              className="font-medium"
              startContent={
                !isSending ? <Send className="h-4 w-4" /> : undefined
              }
            >
              {isSending ? "Sending..." : "Send Email"}
            </Button>
          </div>
        </div>
      </div>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onOpenChange={setIsEditModalOpen}
        size="2xl"
        classNames={{
          base: "bg-white",
          header: "border-b border-gray-200",
          body: "py-6",
          footer: "border-t border-gray-200",
        }}
      >
        <ModalContent>
          <ModalHeader className="flex flex-col gap-1">
            <h2 className="text-xl font-semibold text-gray-900">Edit Email</h2>
            <p className="text-sm text-gray-600">
              Make changes to your email before sending
            </p>
          </ModalHeader>

          <ModalBody className="space-y-4">
            {/* To Field */}
            <div>
              <Input
                label="Recipients"
                placeholder="Enter email addresses separated by commas"
                value={toInput}
                onChange={(e) => setToInput(e.target.value)}
                variant="bordered"
                isInvalid={!!errors.to}
                errorMessage={errors.to}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
            </div>

            {/* Subject Field */}
            <div>
              <Input
                label="Subject"
                placeholder="Enter email subject"
                value={editData.subject}
                onChange={(e) =>
                  setEditData({ ...editData, subject: e.target.value })
                }
                variant="bordered"
                isInvalid={!!errors.subject}
                errorMessage={errors.subject}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
            </div>

            {/* Body Field */}
            <div>
              <Textarea
                label="Message"
                placeholder="Enter your email message"
                value={editData.body}
                onChange={(e) =>
                  setEditData({ ...editData, body: e.target.value })
                }
                variant="bordered"
                minRows={6}
                maxRows={10}
                isInvalid={!!errors.body}
                errorMessage={errors.body}
                classNames={{
                  input: "text-sm",
                  label: "text-sm font-medium text-gray-700",
                }}
              />
            </div>
          </ModalBody>

          <ModalFooter>
            <Button
              variant="light"
              onPress={() => setIsEditModalOpen(false)}
              className="text-gray-600"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              onPress={handleSave}
              className="font-medium"
            >
              Save Changes
            </Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </>
  );
}
