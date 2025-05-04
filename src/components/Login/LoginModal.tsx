"use client";

import { Modal, ModalBody, ModalContent } from "@heroui/modal";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { handleGoogleLogin } from "@/hooks/handleGoogleLogin";
import { useLoginModal, useLoginModalActions } from "@/hooks/useLoginModal";

import { GoogleColouredIcon } from "../Misc/icons";
import { Button } from "../ui/button";

export default function LoginModal() {
  const isOpen = useLoginModal();
  const { setLoginModalOpen } = useLoginModalActions();
  const pathname = usePathname();

  // Prevent rendering on /login or /signup pages
  if (pathname === "/login" || pathname === "/signup") return null;

  return (
    <Modal
      isOpen={isOpen}
      onOpenChange={(v) => setLoginModalOpen(v)}
      isDismissable={false}
      isKeyboardDismissDisabled
      hideCloseButton
    >
      <ModalContent className="p-7">
        <ModalBody>
          <div className="mb-3 space-y-2 text-center">
            <div className="text-5xl font-medium">Login</div>
            <div className="text-md text-foreground-600">
              Please login to continue your journey with GAIA.
            </div>
          </div>
          <Button
            className="text-md gap-2 rounded-full px-4"
            size="lg"
            variant="secondary"
            onClick={handleGoogleLogin}
          >
            <GoogleColouredIcon />
            Sign in with Google
          </Button>
          <Link
            href="/signup"
            className="text-md w-full gap-2 rounded-full px-4 text-center font-normal text-primary"
            onClick={() => setLoginModalOpen(false)}
          >
            New to GAIA? Create an Account
          </Link>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
