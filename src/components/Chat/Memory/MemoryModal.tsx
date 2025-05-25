"use client";

import {
  Button,
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
} from "@heroui/react";

import MemoryManagement from "@/components/Memory/MemoryManagement";

interface MemoryModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function MemoryModal({ isOpen, onClose }: MemoryModalProps) {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      size="2xl"
      scrollBehavior="inside"
      classNames={{
        body: "py-6",
        backdrop:
          "bg-gradient-to-t from-zinc-900 to-zinc-900/10 backdrop-opacity-20",
      }}
    >
      <ModalContent>
        {(onClose) => (
          <>
            <ModalBody>
              <div className="font-bold">Your Memories</div>
              <MemoryManagement onClose={onClose} autoFetch={isOpen} />
            </ModalBody>

            <ModalFooter>
              <Button color="default" variant="light" onPress={onClose}>
                Close
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
