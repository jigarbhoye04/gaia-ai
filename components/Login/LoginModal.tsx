"use client";

import { useLoginModal, useLoginModalActions } from "@/hooks/useLoginModal";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";
import Link from "next/link";
import { GoogleColouredIcon } from "../Misc/icons";
import { Button } from "../ui/button";
import { handleGoogleLogin } from "@/hooks/handleGoogleLogin";
import { usePathname } from "next/navigation";

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
          <div className="mb-3 text-center space-y-2">
            <div className="text-5xl font-medium">Login</div>
            <div className="text-foreground-600 text-md">
              Please login to continue your journey with GAIA.
            </div>
          </div>
          <Button
            className="rounded-full text-md gap-2 px-4"
            size="lg"
            variant="secondary"
            onClick={handleGoogleLogin}
          >
            <GoogleColouredIcon />
            Sign in with Google
          </Button>
          <Link
            href="/get-started"
            className="rounded-full text-md gap-2 px-4 text-primary font-normal text-center w-full"
            onClick={() => setLoginModalOpen(false)}
          >
            New to GAIA? Create an Account
          </Link>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
