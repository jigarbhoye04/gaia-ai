"use client";

import { RootState } from "@/redux";
import { setOpen } from "@/redux/slices/loginModalSlice";
import { Modal, ModalBody, ModalContent } from "@heroui/modal";
import Link from "next/link";
import { useDispatch, useSelector } from "react-redux";
import { GoogleColouredIcon } from "../Misc/icons";
import { Button } from "../ui/button";

export default function LoginModal() {
  const open = useSelector((state: RootState) => state.loginModal.open);
  const dispatch = useDispatch();

  return (
    <Modal isOpen={open} onOpenChange={(v) => dispatch(setOpen(v))}>
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
            onClick={() => console.log("Handle Google Login")}
          >
            <GoogleColouredIcon />
            Sign in with Google
          </Button>
          <Link
            href="/get-started"
            className="rounded-full text-md gap-2 px-4 text-primary font-normal text-center w-full"
            onClick={() => dispatch(setOpen(false))}
          >
            New to GAIA? Create an Account
          </Link>
        </ModalBody>
      </ModalContent>
    </Modal>
  );
}
