"use client";

import { Button } from "@heroui/button";
import { Input } from "@heroui/input";
import { Kbd } from "@heroui/react";
import { useEffect, useRef, useState } from "react";

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
  const [userResponses, setUserResponses] = useState<Record<string, string>>(
    {},
  );
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

    if (!inputValue.trim() || isProcessing) return;

    setIsProcessing(true);
    const currentQuestion = questions[currentQuestionIndex];

    // Add user message
    const userMessage: Message = {
      id: `user-${Date.now()}`,
      type: "user",
      content: inputValue,
    };

    setMessages((prev) => [...prev, userMessage]);

    // Save user response
    const newResponses = {
      ...userResponses,
      [currentQuestion.fieldName]: inputValue,
    };
    setUserResponses(newResponses);

    // Clear input
    setInputValue("");

    // Process next question after a delay
    setTimeout(() => {
      if (currentQuestionIndex < questions.length - 1) {
        // Special greeting for the first question (name)
        if (currentQuestionIndex === 0) {
          const greetingMessage: Message = {
            id: `greeting-${Date.now()}`,
            type: "bot",
            content: `Nice to meet you, ${newResponses.name}! 😊`,
          };
          setMessages((prev) => [...prev, greetingMessage]);

          // Add a small delay before the next question
          setTimeout(() => {
            const nextQuestion = questions[currentQuestionIndex + 1];
            let questionText = nextQuestion.question;

            // Replace placeholders with user responses
            Object.entries(newResponses).forEach(([key, value]) => {
              questionText = questionText.replace(`{${key}}`, value);
            });

            const botMessage: Message = {
              id: nextQuestion.id,
              type: "bot",
              content: questionText,
            };

            setMessages((prev) => [...prev, botMessage]);
            setCurrentQuestionIndex((prev) => prev + 1);
          }, 800);
        } else {
          const nextQuestion = questions[currentQuestionIndex + 1];
          let questionText = nextQuestion.question;

          // Replace placeholders with user responses
          Object.entries(newResponses).forEach(([key, value]) => {
            questionText = questionText.replace(`{${key}}`, value);
          });

          const botMessage: Message = {
            id: nextQuestion.id,
            type: "bot",
            content: questionText,
          };

          setMessages((prev) => [...prev, botMessage]);
          setCurrentQuestionIndex((prev) => prev + 1);
        }
      } else {
        // Onboarding complete
        const finalMessage: Message = {
          id: "final",
          type: "bot",
          content: `Thank you, ${newResponses.name}! I'm all set up and ready to assist you. Let's get started!`,
        };

        setMessages((prev) => [...prev, finalMessage]);

        // TODO: Save user preferences and redirect to main app
        setTimeout(() => {
          // Redirect to main app or save preferences
          console.log("User responses:", newResponses);
        }, 2000);
      }

      setIsProcessing(false);
    }, 1000);
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Fixed Input Container */}
      <div className="relative z-10 mx-auto w-full max-w-lg pb-3">
        <form onSubmit={handleSubmit} className="mx-auto w-full max-w-2xl">
          <div className="relative">
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
