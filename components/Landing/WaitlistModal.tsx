import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { DialogDescription } from "@radix-ui/react-dialog";
import React, { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import {
  ArrowUpRight01Icon,
  Calendar01Icon,
  Cancel01Icon,
  Mail01Icon,
} from "../Misc/icons";

import PartySmiley from "@/components/Smileys/20.webp";
import createConfetti from "@/hooks/createConfetti";
import api from "@/utils/apiaxios";

export default function WaitListButton({
  props,
  text = "Signup for the Waitlist",
  secondarytext = "",
  iconsize = 15,
}: {
  props: any;
  text?: string;
  secondarytext?: string;
  iconsize?: number;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button
        className="arrow_diagonal_btn"
        color="primary"
        endContent={
          <ArrowUpRight01Icon
            className="arrow_diagonal"
            color="primary"
            height={iconsize}
            width={iconsize}
          />
        }
        radius="full"
        size="lg"
        variant="shadow"
        onPress={() => setOpen(true)}
        {...props}
      >
        <div>
          <span className="font-medium">{text}</span>
          {secondarytext && <span>{secondarytext}</span>}
        </div>
      </Button>
      <WaitListModal open={open} setOpen={setOpen} />
    </>
  );
}

export function WaitListModal({
  open,
  setOpen,
}: {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [successfullySubmitted, setSuccessfullySubmitted] = useState(false);

  function validateEmail(value: string) {
    if (value === "") return false;
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i;

    return regex.test(value.trim());
  }
  const isInvalidEmail = useMemo(() => {
    return !validateEmail(email);
  }, [email]);

  function clearInputs() {
    setEmail("");
  }

  const SubmitForm = async () => {
    setLoading(true);
    setSubmitted(false);
    if (validateEmail(email)) {
      try {
        const response = await api.post("/waitlistSignup", {
          email,
        });

        console.log(response.data.message);

        clearInputs();
        createConfetti();
        setSuccessfullySubmitted(true);
      } catch (error) {
        console.log(error);
        toast.error("Uh oh! Something went wrong.", {
          classNames: {
            toast:
              "flex items-center p-3 rounded-xl gap-3 w-[350px] toast_error",
            title: " text-sm",
            description: "text-sm",
          },
          duration: 3000,
          description: "There was a problem signing up.\n",
        });
      }
    } else console.log("invalid form");

    setLoading(false);
    setSubmitted(true);
  };

  useEffect(() => {
    if (open) {
      setSubmitted(false);
      setSuccessfullySubmitted(false);
    }
  }, [open]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") SubmitForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="bg-zinc-900 text-white border-none max-w-md flex justify-center items-center">
        <DialogHeader>
          <DialogTitle className="text-center">
            {successfullySubmitted
              ? "Thank You for joining the Waitlist!"
              : "Join the Waitlist"}
          </DialogTitle>
          <DialogDescription className="pb-3 text-center">
            We'll be sending you an email once we launch, featuring exclusive
            perks including a Pro subscription for free!
          </DialogDescription>
          {successfullySubmitted ? (
            <>
              <div className="w-full flex justify-center">
                <img
                  alt="Smiley face party"
                  height={230}
                  src={PartySmiley}
                  width={230}
                />
              </div>
              <DialogClose asChild>
                <div className="flex justify-center w-full">
                  <Button
                    className="w-fit"
                    color="success"
                    radius="lg"
                    startContent={
                      <Cancel01Icon color="foreground" width="20" />
                    }
                    variant="flat"
                    onPress={() => setOpen(false)}
                  >
                    Close
                  </Button>
                </div>
              </DialogClose>
            </>
          ) : (
            <div className="flex w-full flex-col items-center">
              <Input
                isRequired
                className="dark max-w-sm"
                color={submitted && isInvalidEmail ? "danger" : "primary"}
                errorMessage="Please enter a valid email"
                isInvalid={submitted && isInvalidEmail}
                label="Email"
                placeholder="name@example.com"
                startContent={<Mail01Icon height="21" />}
                type="email"
                value={email}
                variant="faded"
                onKeyDown={handleKeyDown}
                onValueChange={(value) => setEmail(value.trim())}
              />

              <div className="flex w-full justify-center pt-3 gap-3">
                <DialogClose asChild>
                  <Button
                    color="danger"
                    radius="lg"
                    startContent={
                      <Cancel01Icon color="foreground" width="20" />
                    }
                    variant="light"
                  >
                    Cancel
                  </Button>
                </DialogClose>

                <Button
                  children={"Signup"}
                  color="primary"
                  endContent={<Calendar01Icon color="foreground" width="20" />}
                  isLoading={loading}
                  radius="lg"
                  onPress={SubmitForm}
                />
              </div>
            </div>
          )}
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
}
