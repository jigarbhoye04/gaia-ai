"use client";

import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { ArrowRight, Check, Sparkles } from "lucide-react";
import React from "react";

interface SubscriptionSuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateToChat: () => void;
  planName?: string;
}

export function SubscriptionSuccessModal({
  isOpen,
  onClose,
  onNavigateToChat,
  planName = "Pro",
}: SubscriptionSuccessModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} size="md" backdrop="blur">
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-green-500">
              <Check className="h-6 w-6 text-white" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-gray-900">
            Welcome to GAIA {planName}!
          </h2>
          <p className="text-gray-600">Your subscription is now active</p>
        </ModalHeader>

        <ModalBody className="text-center">
          <div className="space-y-4">
            <div className="rounded-lg bg-blue-50 p-4">
              <div className="mb-2 flex items-center justify-center gap-2 text-blue-600">
                <Sparkles className="h-5 w-5" />
                <span className="font-semibold">All Features Unlocked</span>
              </div>
              <p className="text-sm text-blue-700">
                You now have access to all premium features, unlimited
                conversations, and priority support.
              </p>
            </div>

            <div className="text-sm text-gray-600">
              A confirmation email has been sent to your inbox with your
              subscription details.
            </div>
          </div>
        </ModalBody>

        <ModalFooter className="flex flex-col gap-2">
          <Button
            color="primary"
            variant="shadow"
            className="w-full font-medium"
            onPress={onNavigateToChat}
            endContent={<ArrowRight className="h-4 w-4" />}
          >
            Start Chatting with GAIA
          </Button>
          <Button
            variant="light"
            className="w-full text-gray-600"
            onPress={onClose}
          >
            I'll explore later
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
