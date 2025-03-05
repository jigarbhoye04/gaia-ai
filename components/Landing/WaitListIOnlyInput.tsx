import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import * as React from "react";
import { toast } from "sonner";

import { CheckmarkCircle02Icon } from "../Misc/icons.js";

import CreateConfetti from "@/hooks/createConfetti";
import api from "@/utils/apiaxios";

export default function WaitlistOnlyInput() {
  const [loading, setLoading] = React.useState<boolean>(false);
  const [email, setEmail] = React.useState<string>("");
  const [submitted, setSubmitted] = React.useState<boolean>(false);
  const [succesfullySubmitted, setSuccessfulySubmitted] =
    React.useState<boolean>(false);

  function validateEmail(value: string): boolean {
    if (value === "") return false;
    const regex = /^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/i;

    return regex.test(value.trim());
  }

  const isInvalidEmail = React.useMemo(() => !validateEmail(email), [email]);

  function clearInputs() {
    setEmail("");
  }

  const SubmitForm = async () => {
    setLoading(true);
    setSubmitted(false);

    if (validateEmail(email)) {
      try {
        const response = await api.post("/waitlistSignup", { email });

        console.log(response.data.message);

        clearInputs();
        CreateConfetti();
        setSuccessfulySubmitted(true);
      } catch (error) {
        console.log(error);
        toast.error("Uh oh! Something went wrong.", {
          classNames: {
            toast:
              "flex items-center p-3 rounded-xl gap-3 w-[350px] toast_error",
            title: "text-sm",
            description: "text-sm",
          },
          duration: 3000,
          description: "There was a problem signing up.\n",
        });
      }
    } else {
      toast.error("Uh oh! Something went wrong.", {
        classNames: {
          toast: "flex items-center p-3 rounded-xl gap-3 w-[350px] toast_error",
          title: "text-sm",
          description: "text-sm",
        },
        duration: 3000,
        description: "Please enter a valid email.\n",
      });
    }

    setSubmitted(true);
    setLoading(false);
  };

  // Handle key down events
  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === "Enter") SubmitForm();
  };

  return (
    <div className="flex gap-2 w-[220px] mt-2 justify-center">
      {!succesfullySubmitted ? (
        <>
          <Input
            isClearable
            isRequired
            className="w-full flex-shrink-0"
            color={submitted && isInvalidEmail ? "danger" : "primary"}
            description="Signup for the waitlist"
            errorMessage="Please enter a valid email"
            isInvalid={submitted && isInvalidEmail}
            placeholder="name@example.com"
            type="email"
            value={email}
            variant="faded"
            onKeyDown={handleKeyDown}
            onValueChange={(value) => setEmail(value.trim())}
          />
          <Button
            children={"Signup"}
            className="font-medium w-full px-2 flex-shrink min-w-[100px]"
            color="primary"
            isLoading={loading}
            size="md"
            variant="shadow"
            onPress={SubmitForm}
          />
        </>
      ) : (
        <Button
          disableRipple
          isIconOnly
          className="font-medium w-full px-2 flex-shrink min-w-[100px] cursor-default"
          color="success"
          endContent={<CheckmarkCircle02Icon />}
          size="md"
          variant="shadow"
        >
          Thank you for signing up! &nbsp;
        </Button>
      )}
    </div>
  );
}
