"use client";

import { Button } from "@heroui/button";
import { Chip } from "@heroui/chip";
import { Input } from "@heroui/input";
import { Kbd } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

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

const questions: Question[] = [
  {
    id: "1",
    question:
      "Hi there! I'm GAIA, your personal AI assistant. What should I call you?",
    placeholder: "Enter your name...",
    fieldName: "name",
  },
  {
    id: "2",
    question:
      "What country are you based in? This helps me understand your preferences better.",
    placeholder: "e.g., India, USA, Germany...",
    fieldName: "country",
  },
  {
    id: "3",
    question: "What's your profession or main area of focus?",
    placeholder: "e.g., Software Developer, Student, Designer...",
    fieldName: "profession",
  },
  {
    id: "4",
    question:
      "How would you like me to respond? Concise and direct, detailed explanations, casual, formal?",
    placeholder: "e.g., Concise and direct...",
    fieldName: "responseStyle",
    chipOptions: [
      { label: "Concise & Direct", value: "concise" },
      { label: "Detailed Explanations", value: "detailed" },
      { label: "Casual", value: "casual" },
      { label: "Formal", value: "formal" },
      { label: "Creative", value: "creative" },
    ],
  },
  {
    id: "5",
    question:
      "Are there any specific instructions you'd like me to follow while assisting you?",
    placeholder: "Let me know how I can best help you...",
    fieldName: "instructions",
  },
];

export default function Onboarding() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [inputValue, setInputValue] = useState("");
  const [selectedCountry, setSelectedCountry] = useState<string | null>(null);
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

  const submitResponse = (responseText: string, _countryCode?: string) => {
    if (isProcessing) return;

    setIsProcessing(true);
    const currentQuestion = questions[currentQuestionIndex];

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content: responseText,
    };
    setMessages((prev) => [...prev, userMessage]);

    // Save user response
    const newResponses = {
      ...userResponses,
      [currentQuestion.fieldName]: responseText,
    };
    setUserResponses(newResponses);

    // Clear inputs
    setInputValue("");
    setSelectedCountry(null);

    // Process next question or complete onboarding
    if (currentQuestionIndex < questions.length - 1) {
      const nextQuestionIndex = currentQuestionIndex + 1;

      // Add greeting after name question
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

      // TODO: Save user preferences and redirect to main app
      console.log("User responses:", newResponses);
    }

    setIsProcessing(false);
  };

  const handleChipSelect = (questionId: string, chipValue: string) => {
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
      submitResponse(selectedChip.label);
    }
  };

  const handleCountrySelect = (countryCode: string | null) => {
    if (isProcessing || !countryCode) return;

    const countryName =
      countries.find((c: Country) => c.code === countryCode)?.name ||
      countryCode;
    submitResponse(countryName, countryCode);
  };

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const currentQuestion = questions[currentQuestionIndex];
    const isCountryQuestion = currentQuestion.fieldName === "country";

    if (isCountryQuestion && selectedCountry) {
      const countryName =
        countries.find((c: Country) => c.code === selectedCountry)?.name ||
        selectedCountry;
      submitResponse(countryName, selectedCountry);
    } else if (!isCountryQuestion && inputValue.trim()) {
      submitResponse(inputValue.trim());
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-black backdrop-blur-2xl">
      {/* Background Gradient */}
      <div
        className="absolute inset-0 z-0"
        style={{
          backgroundImage: `radial-gradient(100% 125% at 50% 100%, #000000 50%, #00bbffAA)`,
        }}
      />

      {/* Messages Container */}
      <div className="relative z-10 flex-1 overflow-y-auto px-4 py-32">
        <div className="relative mx-auto max-w-2xl">
          {messages.map((message) => (
            <div key={message.id} className="mb-4">
              {message.type === "bot" ? (
                <SimpleChatBubbleBot>{message.content}</SimpleChatBubbleBot>
              ) : (
                <SimpleChatBubbleUser>{message.content}</SimpleChatBubbleUser>
              )}
            </div>
          ))}

          {/* Chip Options for Current Question */}
          {currentQuestionIndex < questions.length &&
            questions[currentQuestionIndex].chipOptions && (
              <div className="mb-4">
                <div className="flex flex-wrap gap-2">
                  {questions[currentQuestionIndex].chipOptions!.map(
                    (option) => (
                      <Chip
                        key={option.value}
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
                    ),
                  )}
                </div>
              </div>
            )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Container */}
      <div className="relative z-10 mx-auto w-full max-w-lg pb-3">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
          <div className="relative">
            {currentQuestionIndex < questions.length &&
            questions[currentQuestionIndex].fieldName === "country" ? (
              <CountrySelector
                selectedKey={selectedCountry}
                onSelectionChange={handleCountrySelect}
                placeholder="Search for your country..."
                label=""
              />
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
      </div>
    </div>
  );
}
