import { handleGoogleLogin } from "@/pages/LoginSignup";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";
import { Dispatch, SetStateAction } from "react";
import Link from "next/link";
import { GoogleColouredIcon } from "../Misc/icons";
import { Button } from "../ui/button";

export default function LoginModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: Dispatch<SetStateAction<boolean>>;
}) {
  return (
    <Modal
      isOpen={open}
      onOpenChange={setOpen}
      isDismissable={false}
      hideCloseButton
      backdrop="blur"
      isKeyboardDismissDisabled={true}
    >
      <ModalContent className="p-7">
        <ModalBody>
          <>
            <div className="mb-3 text-center space-y-2">
              <div className="text-5xl font-medium">Login</div>
              <div className="text-foreground-600 text-md">
                Please login to continue your journey with GAIA.
              </div>
            </div>
            <Button
              className="rounded-full text-md gap-2 px-4"
              size={"lg"}
              type="button"
              variant="secondary"
              onClick={() => handleGoogleLogin()}
            >
              <GoogleColouredIcon />
              Sign in with Google
            </Button>
            <Link
              href="/get-started"
              className="rounded-full text-md gap-2 px-4 text-primary font-normal text-center w-full"
              onClick={() => setOpen(false)}
            >
              New to GAIA? Create an Account
            </Link>
          </>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
