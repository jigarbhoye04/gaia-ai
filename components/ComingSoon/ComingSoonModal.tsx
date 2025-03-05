import { Button } from "@heroui/button";
import {
  Modal,
  ModalBody,
  ModalContent,
  ModalFooter,
  ModalHeader,
} from "@heroui/modal";
import { useState } from "react";

const steps = [
  {
    title: "Exciting New Features!",
    description: "Discover what's coming soon to enhance your experience.",
    image: "https://placehold.co/600x400",
    content:
      "We're thrilled to announce a suite of new features that will revolutionize your workflow. From advanced AI-powered suggestions to seamless integrations with your favorite tools, we're taking productivity to the next level.",
  },
  {
    title: "Enhanced Collaboration",
    description: "Work together like never before.",
    image: "https://placehold.co/600x400",
    content:
      "Our new collaboration tools will make teamwork a breeze. Real-time editing, intuitive commenting systems, and smart notifications will keep your team in sync and moving forward efficiently.",
  },
  {
    title: "Powerful Analytics",
    description: "Gain insights to drive your success.",
    image: "https://placehold.co/600x400",
    content:
      "Unlock the potential of your data with our upcoming analytics dashboard. Visualize trends, track performance, and make data-driven decisions with ease. Your path to success is about to become clearer than ever.",
  },
];

export default function ComingSoonModal({
  isOpen,
  setOpen,
}: {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
}) {
  const [currentStep, setCurrentStep] = useState(0);

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      setOpen(false);
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <Modal
      className="dark text-foreground"
      isOpen={isOpen}
      onOpenChange={setOpen}
    >
      <ModalContent>
        <ModalHeader className="flex flex-col gap-1">
          <h2 className="text-2xl">{steps[currentStep].title}</h2>
          <p>{steps[currentStep].description}</p>
        </ModalHeader>

        <ModalBody>
          <img
            alt={`Coming Soon - ${steps[currentStep].title}`}
            className="rounded-xl w-full object-cover h-[200px]"
            loading="eager"
            src={steps[currentStep].image}
          />
          <p>{steps[currentStep].content}</p>
        </ModalBody>

        <ModalFooter className="flex justify-between items-center">
          <Button
            color="danger"
            isDisabled={currentStep === 0}
            variant="light"
            onPress={handlePrevious}
          >
            Previous
          </Button>

          <div className="flex items-center gap-2">
            {steps.map((_, index) => (
              <div
                key={index}
                aria-hidden="true"
                className={`w-2 h-2 rounded-full ${
                  index === currentStep ? "bg-primary" : "bg-gray-600"
                }`}
              />
            ))}
          </div>

          <Button color="primary" onPress={handleNext}>
            {currentStep === steps.length - 1 ? "Finish" : "Next"}
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
}
