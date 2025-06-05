"use client";

import { Autocomplete, AutocompleteItem } from "@heroui/autocomplete";
import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Kbd } from "@heroui/react";
import { motion } from "framer-motion";
import { useCallback, useEffect, useRef, useState } from "react";

import {
  countries,
  Country,
  CountrySelector,
} from "@/components/country-selector";
import { SentIcon } from "@/components/shared/icons";
import {
  SimpleChatBubbleBot,
  SimpleChatBubbleUser,
} from "@/features/landing/components/demo/SimpleChatBubbles";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
}

interface Question {
  id: string;
  question: string;
  placeholder: string;
  fieldName: string;
  chipOptions?: { label: string; value: string }[];
}

const professionOptions = [
  { label: "Student", value: "student" },
  { label: "Teacher", value: "teacher" },
  { label: "Engineer", value: "engineer" },
  { label: "Developer", value: "developer" },
  { label: "Designer", value: "designer" },
  { label: "Manager", value: "manager" },
  { label: "Consultant", value: "consultant" },
  { label: "Entrepreneur", value: "entrepreneur" },
  { label: "Researcher", value: "researcher" },
  { label: "Writer", value: "writer" },
  { label: "Artist", value: "artist" },
  { label: "Doctor", value: "doctor" },
  { label: "Lawyer", value: "lawyer" },
  { label: "Accountant", value: "accountant" },
  { label: "Sales", value: "sales" },
  { label: "Marketing", value: "marketing" },
  { label: "Analyst", value: "analyst" },
  { label: "Freelancer", value: "freelancer" },
  { label: "Retired", value: "retired" },
  { label: "Other", value: "other" },
];

// Constants for field names to avoid magic strings
const FIELD_NAMES = {
  NAME: "name",
  COUNTRY: "country",
  PROFESSION: "profession",
  RESPONSE_STYLE: "responseStyle",
  INSTRUCTIONS: "instructions",
} as const;

const questions: Question[] = [
  {
    id: "1",
    question:
      "Hi there! I'm GAIA, your personal AI assistant. What should I call you?",
    placeholder: "Enter your name...",
    fieldName: FIELD_NAMES.NAME,
  },
  {
    id: "2",
    question:
      "What country are you based in? This helps me understand your preferences better.",
    placeholder: "e.g., India, USA, Germany...",
    fieldName: FIELD_NAMES.COUNTRY,
  },
  {
    id: "3",
    question: "What's your profession or main area of focus?",
    placeholder: "e.g., Software Developer, Student, Designer...",
    fieldName: FIELD_NAMES.PROFESSION,
  },
  {
    id: "4",
    question:
      "How would you prefer me to communicate with you? Choose your preferred response style:",
    placeholder: "Select your preferred communication style...",
    fieldName: FIELD_NAMES.RESPONSE_STYLE,
    chipOptions: [
      { label: "Brief", value: "brief" },
      { label: "Detailed", value: "detailed" },
      { label: "Casual", value: "casual" },
      { label: "Professional", value: "professional" },
    ],
  },
  {
    id: "5",
    question:
      "Are there any specific instructions you'd like me to follow while assisting you?",
    placeholder: "Let me know how I can best help you...",
    fieldName: FIELD_NAMES.INSTRUCTIONS,
  },
];

export default function Onboarding() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
  const [selectedProfession, setSelectedProfession] = useState<string | null>(
    null,
  );
  const [userResponses, setUserResponses] = useState<Record<string, string>>(
    {},
  );
  const [selectedChips, setSelectedChips] = useState<Record<string, string[]>>(
    {},
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Centralized input clearing function
  const clearCurrentInputs = () => {
    setInputValue("");
    setSelectedCountry(null);
    setSelectedProfession(null);
  };

  // Helper function to get display text for responses
  const getDisplayText = useCallback(
    (fieldName: string, value: string): string => {
      switch (fieldName) {
        case FIELD_NAMES.COUNTRY:
          return (
            countries.find((c: Country) => c.code === value)?.name || value
          );
        case FIELD_NAMES.PROFESSION:
          return (
            professionOptions.find((p) => p.value === value)?.label || value
          );
        default:
          return value;
      }
    },
    [],
  );

  const submitResponse = useCallback(
    (responseText: string, rawValue?: string) => {
      if (isProcessing || currentQuestionIndex >= questions.length) return;

      setIsProcessing(true);
      const currentQuestion = questions[currentQuestionIndex];

      // Add user message with display text
      const userMessage: Message = {
        id: `user-${Date.now()}`,
        type: "user",
        content: responseText,
      };
      setMessages((prev) => [...prev, userMessage]);

      // Save user response with raw value for processing
      const newResponses = {
        ...userResponses,
        [currentQuestion.fieldName]: rawValue || responseText,
      };
      setUserResponses(newResponses);

      // Clear all inputs
      clearCurrentInputs();

      // Process next question or complete onboarding
      if (currentQuestionIndex < questions.length - 1) {
        const nextQuestionIndex = currentQuestionIndex + 1;

        // Add greeting after name question only
        if (currentQuestionIndex === 0) {
          const greetingMessage: Message = {
            id: `greeting-${Date.now()}`,
            type: "bot",
            content: `Nice to meet you, ${newResponses.name}! 😊`,
          };
          setMessages((prev) => [...prev, greetingMessage]);
        }

        // Add next question
        const nextQuestion = questions[nextQuestionIndex];
        const botMessage: Message = {
          id: nextQuestion.id,
          type: "bot",
          content: nextQuestion.question,
        };

        setMessages((prev) => [...prev, botMessage]);
        setCurrentQuestionIndex(nextQuestionIndex);
      } else {
        // Onboarding complete
        const finalMessage: Message = {
          id: "final",
          type: "bot",
          content: `Thank you, ${newResponses.name}! I'm all set up and ready to assist you. Let's get started!`,
        };
        setMessages((prev) => [...prev, finalMessage]);
        setIsOnboardingComplete(true);

        // TODO: Save user preferences and redirect to main app
        console.log("User responses:", newResponses);
      }

      setIsProcessing(false);
    },
    [isProcessing, currentQuestionIndex, userResponses],
  );

  const handleChipSelect = useCallback(
    (questionId: string, chipValue: string) => {
      if (isProcessing) return;

      const currentQuestion = questions[currentQuestionIndex];
      setSelectedChips((prev) => ({
        ...prev,
        [questionId]: [chipValue],
      }));

      const selectedChip = currentQuestion.chipOptions?.find(
        (option) => option.value === chipValue,
      );
      if (selectedChip) {
        submitResponse(selectedChip.label, chipValue);
      }
    },
    [isProcessing, currentQuestionIndex, submitResponse],
  );

  const handleCountrySelect = useCallback(
    (countryCode: string | null) => {
      if (isProcessing || !countryCode) return;

      const countryName = getDisplayText("country", countryCode);
      submitResponse(countryName, countryCode);
    },
    [isProcessing, submitResponse, getDisplayText],
  );

  const handleProfessionSelect = useCallback(
    (professionValue: string | null) => {
      if (isProcessing || !professionValue?.trim()) return;

      // Auto-submit when a profession is selected from dropdown (like country selector)
      const professionLabel = getDisplayText("profession", professionValue);
      submitResponse(professionLabel, professionValue);
    },
    [isProcessing, submitResponse, getDisplayText],
  );

  const handleProfessionInputChange = useCallback((value: string) => {
    setSelectedProfession(value);
  }, []);

  const handleProfessionKeyDown = useCallback(
    (e: React.KeyboardEvent) => {
      if (e.key === "Enter" && selectedProfession?.trim() && !isProcessing) {
        e.preventDefault();
        // Submit custom typed profession
        submitResponse(selectedProfession.trim(), selectedProfession.trim());
      }
    },
    [selectedProfession, isProcessing, submitResponse],
  );

  useEffect(() => {
    // Show first question immediately
    const firstQuestion = questions[0];
    setMessages([
      {
        id: firstQuestion.id,
        type: "bot",
        content: firstQuestion.question,
      },
    ]);
  }, []);

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (currentQuestionIndex >= questions.length) return;

      const currentQuestion = questions[currentQuestionIndex];
      const { fieldName } = currentQuestion;

      // Determine which input has a value and submit accordingly
      if (fieldName === FIELD_NAMES.COUNTRY && selectedCountry) {
        handleCountrySelect(selectedCountry);
      } else if (
        fieldName !== FIELD_NAMES.COUNTRY &&
        fieldName !== FIELD_NAMES.PROFESSION &&
        inputValue.trim()
      ) {
        submitResponse(inputValue.trim());
      }
      // Note: Profession is handled directly in handleProfessionSelect and handleProfessionKeyDown
    },
    [
      currentQuestionIndex,
      selectedCountry,
      inputValue,
      handleCountrySelect,
      submitResponse,
    ],
  );

  const handleLetsGo = () => {
    // TODO: Navigate to main app or dashboard
    console.log("Navigating to main app...");
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black backdrop-blur-2xl">
      {/* Animated Background Gradient */}
      <motion.div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(100% 125% at 50% 100%, #000000 50%, #00bbffAA)`,
        }}
        animate={{
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />

      {/* Messages Container */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-32">
        <div className="relative mx-auto max-w-2xl">
          {messages.map((message, index) => (
            <motion.div
              key={message.id}
              className="mb-4"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.5,
                ease: "easeOut",
                delay: index * 0.1,
              }}
            >
              {message.type === "bot" ? (
                <SimpleChatBubbleBot>{message.content}</SimpleChatBubbleBot>
              ) : (
                <SimpleChatBubbleUser>{message.content}</SimpleChatBubbleUser>
              )}
            </motion.div>
          ))}

          {/* Chip Options for Current Question */}
          {currentQuestionIndex < questions.length &&
            questions[currentQuestionIndex].chipOptions && (
              <motion.div
                className="mb-4"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{
                  duration: 0.4,
                  ease: "easeOut",
                  delay: 0.2,
                }}
              >
                <div className="flex flex-wrap gap-2">
                  {questions[currentQuestionIndex].chipOptions!.map(
                    (option, index) => (
                      <motion.div
                        key={option.value}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{
                          duration: 0.3,
                          ease: "easeOut",
                          delay: 0.3 + index * 0.1,
                        }}
                      >
                        <Chip
                          className="cursor-pointer"
                          color="primary"
                          size="sm"
                          variant={
                            selectedChips[
                              questions[currentQuestionIndex].id
                            ]?.includes(option.value)
                              ? "solid"
                              : "flat"
                          }
                          onClick={() =>
                            handleChipSelect(
                              questions[currentQuestionIndex].id,
                              option.value,
                            )
                          }
                        >
                          {option.label}
                        </Chip>
                      </motion.div>
                    ),
                  )}
                </div>
              </motion.div>
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Container */}
      <div className="relative z-10 mx-auto w-full max-w-lg pb-3">
        {isOnboardingComplete ? (
          <motion.div
            className="mx-auto w-full max-w-2xl text-center"
            initial={{ opacity: 0, scale: 0.8, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: "easeOut",
              delay: 0.3,
            }}
          >
            <Button
              onClick={handleLetsGo}
              color="primary"
              size="lg"
              radius="full"
              className="px-8 py-3 text-lg font-semibold"
            >
              Let's Go! 🚀
            </Button>
          </motion.div>
        ) : (
          <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
            <div className="relative">
              {currentQuestionIndex < questions.length &&
              questions[currentQuestionIndex].fieldName ===
                FIELD_NAMES.COUNTRY ? (
                <CountrySelector
                  selectedKey={selectedCountry}
                  onSelectionChange={handleCountrySelect}
                  placeholder="Search for your country..."
                  label=""
                />
              ) : currentQuestionIndex < questions.length &&
                questions[currentQuestionIndex].fieldName ===
                  FIELD_NAMES.PROFESSION ? (
                <Autocomplete
                  inputValue={selectedProfession || ""}
                  onInputChange={handleProfessionInputChange}
                  onSelectionChange={handleProfessionSelect}
                  onKeyDown={handleProfessionKeyDown}
                  placeholder="Type or select your profession..."
                  variant="faded"
                  size="lg"
                  radius="full"
                  allowsCustomValue
                  classNames={{
                    base: "w-full",
                    inputWrapper: "h-14",
                  }}
                >
                  {professionOptions.map((profession) => (
                    <AutocompleteItem
                      key={profession.value}
                      value={profession.value}
                    >
                      {profession.label}
                    </AutocompleteItem>
                  ))}
                </Autocomplete>
              ) : (
                <Input
                  ref={inputRef}
                  value={inputValue}
                  radius="full"
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder={
                    currentQuestionIndex < questions.length
                      ? questions[currentQuestionIndex].placeholder
                      : "Type your message..."
                  }
                  variant="faded"
                  size="lg"
                  classNames={{ inputWrapper: "pr-1" }}
                  endContent={
                    <Button
                      isIconOnly
                      type="submit"
                      disabled={!inputValue.trim() || isProcessing}
                      color="primary"
                      radius="full"
                      aria-label="Send message"
                      className={cn(isProcessing && "cursor-wait")}
                    >
                      <SentIcon color="black" />
                    </Button>
                  }
                />
              )}
            </div>
            <p className="mt-2 flex items-center justify-center space-x-1 text-center text-xs text-zinc-500">
              <span>Press</span>
              <Kbd keys={"enter"} />
              <span>to continue</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
