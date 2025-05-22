import { Button } from "@heroui/button";
import { Input, Textarea } from "@heroui/input";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { Chip } from "@heroui/chip";
import { Edit, Mail, Send, User, X, Plus, Search } from "lucide-react";
import React, { useState, useEffect } from "react";
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

const emailValidationSchema = z.string().email("Invalid email address");

interface EmailData {
  to: string[];
  subject: string;
  body: string;
}

interface EmailComposeCardProps {
  emailData: EmailData;
  onSent?: () => void;
}

function EditEmailModal({
  isOpen,
  onClose,
  onSave,
  editData,
  setEditData,
  errors,
}: {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editData: EmailData;
  setEditData: React.Dispatch<React.SetStateAction<EmailData>>;
  errors: Record<string, string>;
}) {
  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="2xl">
      <ModalContent className="w-full max-w-md">
        <ModalBody>
          <div className="pt-2 text-sm font-medium">Edit Email</div>
          {/* Subject Field */}
          <div className="mb-1">
            <Input
              label="Subject"
              placeholder="Subject"
              value={editData.subject}
              onChange={(e) =>
                setEditData({ ...editData, subject: e.target.value })
              }
              isInvalid={!!errors.subject}
              errorMessage={errors.subject}
              size="sm"
            />
          </div>
          {/* Body Field */}
          <div>
            <Textarea
              label="Message"
              placeholder="Your message"
              value={editData.body}
              onChange={(e) =>
                setEditData({ ...editData, body: e.target.value })
              }
              minRows={5}
              maxRows={8}
              isInvalid={!!errors.body}
              errorMessage={errors.body}
              size="sm"
            />
          </div>
          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <Button
              variant="light"
              size="sm"
              onPress={onClose}
              className="h-7 px-2 text-xs text-gray-300"
            >
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              onPress={onSave}
              className="h-7 px-3 text-xs font-medium"
            >
              Save
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

function RecipientSelectionModal({
  isOpen,
  onClose,
  onConfirm,
  suggestions,
  selectedEmails,
  setSelectedEmails,
  customEmailInput,
  setCustomEmailInput,
  customEmailError,
  setCustomEmailError,
  handleAddCustomEmail,
}: {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  suggestions: string[];
  selectedEmails: string[];
  setSelectedEmails: React.Dispatch<React.SetStateAction<string[]>>;
  customEmailInput: string;
  setCustomEmailInput: React.Dispatch<React.SetStateAction<string>>;
  customEmailError: string;
  setCustomEmailError: React.Dispatch<React.SetStateAction<string>>;
  handleAddCustomEmail: () => void;
}) {
  const handleSuggestionToggle = (email: string) => {
    setSelectedEmails((prev) => {
      if (prev.includes(email)) {
        // Remove from selected
        return prev.filter((e) => e !== email);
      } else {
        // Add to selected
        return [...prev, email];
      }
    });
  };

  const handleCustomEmailKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddCustomEmail();
    }
  };

  return (
    <Modal isOpen={isOpen} onOpenChange={onClose} size="sm">
      <ModalContent>
        <ModalBody>
          <div className="pt-2 text-sm font-medium">Email Suggestions</div>

          {/* Suggestions */}
          <div className="flex flex-wrap gap-2">
            {suggestions.map((email) => (
              <Chip
                key={email}
                size="sm"
                variant="flat"
                color={selectedEmails.includes(email) ? "primary" : "default"}
                className="cursor-pointer text-xs"
                onClick={() => handleSuggestionToggle(email)}
                endContent={
                  selectedEmails.includes(email) ? (
                    <X className="h-3 w-3" />
                  ) : null
                }
              >
                {email}
              </Chip>
            ))}
          </div>

          <hr className="my-2 border-zinc-700" />

          <div className="flex gap-2">
            <Input
              placeholder="Add email..."
              value={customEmailInput}
              onChange={(e) => {
                setCustomEmailInput(e.target.value);
                setCustomEmailError("");
              }}
              onKeyDown={handleCustomEmailKeyPress}
              size="sm"
              isInvalid={!!customEmailError}
              errorMessage={customEmailError}
            />
            <Button
              size="sm"
              color="primary"
              onPress={handleAddCustomEmail}
              isIconOnly
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {/* Action Buttons */}
          <div className="mt-4 flex justify-end gap-2">
            <Button variant="light" size="sm" onPress={onClose}>
              Cancel
            </Button>
            <Button
              color="primary"
              size="sm"
              onPress={onConfirm}
              isDisabled={selectedEmails.length === 0}
            >
              Done ({selectedEmails.length})
            </Button>
          </div>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}

export default function EmailComposeCard({
  emailData,
  onSent,
}: EmailComposeCardProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isRecipientModalOpen, setIsRecipientModalOpen] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [editData, setEditData] = useState<EmailData>(emailData);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Suggestions come from emailData.to - these are the initial suggestions
  const [suggestions, setSuggestions] = useState<string[]>(emailData.to || []);

  // Selected emails state - starts empty, user must select
  const [selectedEmails, setSelectedEmails] = useState<string[]>([]);

  // Custom email input state
  const [customEmailInput, setCustomEmailInput] = useState("");
  const [customEmailError, setCustomEmailError] = useState("");

  // Search/filter state
  const [searchTerm, setSearchTerm] = useState("");

  // Initialize with empty emails array - user must select recipients
  useEffect(() => {
    setEditData((prev) => ({ ...prev, to: [] }));
    setSelectedEmails([]);
    setSuggestions(emailData.to || []);
  }, [emailData.to]);

  const validateForm = () => {
    try {
      emailComposeSchema.parse({
        to: selectedEmails,
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

  const validateCustomEmail = (email: string): boolean => {
    try {
      emailValidationSchema.parse(email);
      setCustomEmailError("");
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        setCustomEmailError(error.errors[0]?.message || "Invalid email");
      }
      return false;
    }
  };

  const handleSend = async () => {
    if (selectedEmails.length === 0) {
      toast.error("Please select at least one recipient");
      return;
    }

    if (!validateForm()) {
      toast.error("Please fix the validation errors");
      return;
    }

    setIsSending(true);
    try {
      await apiauth.post("/mail/send", {
        to: selectedEmails,
        subject: editData.subject,
        body: editData.body,
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

    const updatedData = {
      ...editData,
      to: selectedEmails,
    };

    setEditData(updatedData);
    setIsEditModalOpen(false);
    toast.success("Email updated successfully!");
  };

  const handleEditClick = () => {
    setErrors({});
    setIsEditModalOpen(true);
  };

  // Handle custom email addition
  const handleAddCustomEmail = () => {
    const trimmedEmail = customEmailInput.trim();

    if (!trimmedEmail) {
      setCustomEmailError("Please enter an email address");
      return;
    }

    if (!validateCustomEmail(trimmedEmail)) {
      return;
    }

    if (selectedEmails.includes(trimmedEmail)) {
      setCustomEmailError("Email already selected");
      return;
    }

    // Add to selected emails
    setSelectedEmails((prev) => [...prev, trimmedEmail]);

    // Add to suggestions if not already there
    if (!suggestions.includes(trimmedEmail)) {
      setSuggestions((prev) => [...prev, trimmedEmail]);
    }

    // Clear input
    setCustomEmailInput("");
    setCustomEmailError("");
    toast.success(`Added ${trimmedEmail}`);
  };

  const handleRemoveSelectedEmail = (email: string) => {
    setSelectedEmails((prev) => prev.filter((e) => e !== email));
  };

  const handleConfirmRecipients = () => {
    setEditData((prev) => ({ ...prev, to: selectedEmails }));
    setIsRecipientModalOpen(false);
    toast.success(`Selected ${selectedEmails.length} recipient(s)`);
  };

  // Filter suggestions based on search term
  const filteredSuggestions = suggestions.filter((email) =>
    email.toLowerCase().includes(searchTerm.toLowerCase()),
  );

  return (
    <>
      {/* Main Email Card */}
      <div className="mx-auto w-full max-w-md overflow-hidden rounded-3xl bg-zinc-800 shadow-lg backdrop-blur-sm">
        <div className="absolute top-2 right-2 flex gap-1">
          <Button isIconOnly variant="light" onPress={handleEditClick}>
            <Edit className="h-5 w-5" />
          </Button>
        </div>

        {/* Content */}
        <div className="space-y-3 p-4">
          {/* Recipients Section */}
          <div className="flex items-start gap-2">
            <div className="flex-1">
              <div className="flex flex-col gap-2">
                {/* Select Recipients Button */}
                <Button
                  size="sm"
                  color="primary"
                  onPress={() => setIsRecipientModalOpen(true)}
                  className="h-8 w-fit rounded-full px-3 py-1 text-xs font-normal"
                  startContent={<User className="h-3 w-3" />}
                >
                  {selectedEmails.length === 0
                    ? "Select Recipients"
                    : `${selectedEmails.length} Selected`}
                </Button>

                {/* Selected Email Chips */}
                {selectedEmails.length > 0 && (
                  <div className="flex flex-wrap gap-1">
                    {selectedEmails.slice(0, 3).map((email) => (
                      <Chip
                        key={email}
                        size="sm"
                        variant="flat"
                        color="primary"
                        className="text-xs"
                        endContent={
                          <button
                            onClick={() => handleRemoveSelectedEmail(email)}
                            className="ml-1 rounded-full p-0.5 hover:bg-primary-200"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        }
                      >
                        {email}
                      </Chip>
                    ))}
                    {selectedEmails.length > 3 && (
                      <Chip size="sm" variant="flat" className="text-xs">
                        +{selectedEmails.length - 3} more
                      </Chip>
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="relative rounded-r-xl bg-zinc-900 p-3 pl-5">
            <div className="absolute top-0 left-0 h-full min-w-1 rounded-full bg-primary" />
            <div className="mb-0.5 text-xs font-bold text-gray-500">
              Subject
            </div>
            <div className="text-sm text-gray-200">{editData.subject}</div>
          </div>

          <div className="relative rounded-r-xl bg-zinc-900 p-3 pl-5">
            <div className="absolute top-0 left-0 h-full min-w-1 rounded-full bg-primary" />
            <div className="mb-0.5 text-xs font-bold text-gray-500">Body</div>
            <div className="max-h-24 overflow-y-auto text-sm leading-relaxed text-gray-200">
              {editData.body}
            </div>
          </div>
        </div>

        <div className="px-4 pb-4">
          <div className="flex justify-end">
            <Button
              color="primary"
              onPress={handleSend}
              isLoading={isSending}
              isDisabled={selectedEmails.length === 0}
              startContent={
                isSending ? undefined : <Send className="h-3.5 w-3.5" />
              }
            >
              {isSending ? "Sending..." : "Send"}
            </Button>
          </div>
        </div>
      </div>

      <EditEmailModal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        onSave={handleSave}
        editData={editData}
        setEditData={setEditData}
        errors={errors}
      />

      <RecipientSelectionModal
        isOpen={isRecipientModalOpen}
        onClose={() => setIsRecipientModalOpen(false)}
        onConfirm={handleConfirmRecipients}
        suggestions={suggestions}
        selectedEmails={selectedEmails}
        setSelectedEmails={setSelectedEmails}
        customEmailInput={customEmailInput}
        setCustomEmailInput={setCustomEmailInput}
        customEmailError={customEmailError}
        setCustomEmailError={setCustomEmailError}
        handleAddCustomEmail={handleAddCustomEmail}
      />
    </>
  );
}