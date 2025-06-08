import { useCallback, useEffect, useRef, useState } from "react";

import { countries, Country } from "@/components/country-selector";

import { FIELD_NAMES, professionOptions, questions } from "../constants";
import { Message, OnboardingState } from "../types";

export const useOnboarding = () => {
  const [onboardingState, setOnboardingState] = useState<OnboardingState>({
    messages: [],
    currentQuestionIndex: 0,
    currentInputs: {
      text: "",
      selectedCountry: null,
      selectedProfession: null,
    },
    userResponses: {},
    isProcessing: false,
    isOnboardingComplete: false,
    hasAnsweredCurrentQuestion: false,
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [onboardingState.messages]);

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
      if (
        onboardingState.isProcessing ||
        onboardingState.currentQuestionIndex >= questions.length
      )
        return;

      const currentQuestion = questions[onboardingState.currentQuestionIndex];

      setOnboardingState((prev) => {
        const newState = { ...prev };
        newState.isProcessing = true;
        newState.hasAnsweredCurrentQuestion = true;

        const userMessage: Message = {
          id: `user-${Date.now()}`,
          type: "user",
          content: responseText,
        };
        newState.messages = [...prev.messages, userMessage];

        const newResponses = {
          ...prev.userResponses,
          [currentQuestion.fieldName]: rawValue || responseText,
        };
        newState.userResponses = newResponses;

        newState.currentInputs = {
          text: "",
          selectedCountry: null,
          selectedProfession: null,
        };

        if (prev.currentQuestionIndex < questions.length - 1) {
          const nextQuestionIndex = prev.currentQuestionIndex + 1;

          if (prev.currentQuestionIndex === 0) {
            const greetingMessage: Message = {
              id: `greeting-${Date.now()}`,
              type: "bot",
              content: `Nice to meet you, ${newResponses.name}! 😊`,
            };
            newState.messages = [...newState.messages, greetingMessage];
          }

          const nextQuestion = questions[nextQuestionIndex];
          const botMessage: Message = {
            id: nextQuestion.id,
            type: "bot",
            content: nextQuestion.question,
          };

          newState.messages = [...newState.messages, botMessage];
          newState.currentQuestionIndex = nextQuestionIndex;
          newState.hasAnsweredCurrentQuestion = false;
        } else {
          const finalMessage: Message = {
            id: "final",
            type: "bot",
            content: `Thank you, ${newResponses.name}! I'm all set up and ready to assist you. Let's get started!`,
          };
          newState.messages = [...newState.messages, finalMessage];
          newState.isOnboardingComplete = true;
        }

        newState.isProcessing = false;
        return newState;
      });
    },
    [onboardingState.isProcessing, onboardingState.currentQuestionIndex],
  );

  const handleChipSelect = useCallback(
    (questionId: string, chipValue: string) => {
      if (
        onboardingState.isProcessing ||
        onboardingState.hasAnsweredCurrentQuestion
      )
        return;

      const currentQuestion = questions[onboardingState.currentQuestionIndex];

      // Ensure we're selecting from the current question only
      if (currentQuestion.id !== questionId) return;

      const selectedChip = currentQuestion.chipOptions?.find(
        (option) => option.value === chipValue,
      );
      if (selectedChip) {
        if (chipValue === "skip") {
          submitResponse("I'll skip this for now", "");
        } else if (chipValue === "none") {
          submitResponse("No special instructions", "");
        } else {
          submitResponse(selectedChip.label, chipValue);
        }
      }
    },
    [
      onboardingState.isProcessing,
      onboardingState.currentQuestionIndex,
      onboardingState.hasAnsweredCurrentQuestion,
      submitResponse,
    ],
  );

  const handleCountrySelect = useCallback(
    (countryCode: string | null) => {
      if (onboardingState.isProcessing || !countryCode) return;

      const countryName = getDisplayText("country", countryCode);
      submitResponse(countryName, countryCode);
    },
    [onboardingState.isProcessing, submitResponse, getDisplayText],
  );

  const handleProfessionSelect = useCallback(
    (professionKey: React.Key | null) => {
      if (
        onboardingState.isProcessing ||
        !professionKey ||
        typeof professionKey !== "string" ||
        !professionKey.trim()
      )
        return;

      const professionLabel = getDisplayText("profession", professionKey);
      submitResponse(professionLabel, professionKey);
    },
    [onboardingState.isProcessing, submitResponse, getDisplayText],
  );

  const handleProfessionInputChange = useCallback(
    (value: string) => {
      if (!onboardingState.isProcessing) {
        setOnboardingState((prev) => ({
          ...prev,
          currentInputs: {
            ...prev.currentInputs,
            selectedProfession: value,
          },
        }));
      }
    },
    [onboardingState.isProcessing],
  );

  const handleInputChange = useCallback(
    (value: string) => {
      if (!onboardingState.isProcessing) {
        setOnboardingState((prev) => ({
          ...prev,
          currentInputs: {
            ...prev.currentInputs,
            text: value,
          },
        }));
      }
    },
    [onboardingState.isProcessing],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();

      if (onboardingState.currentQuestionIndex >= questions.length) return;

      const currentQuestion = questions[onboardingState.currentQuestionIndex];
      const { fieldName } = currentQuestion;

      if (
        fieldName === FIELD_NAMES.COUNTRY &&
        onboardingState.currentInputs.selectedCountry
      ) {
        handleCountrySelect(onboardingState.currentInputs.selectedCountry);
      } else if (
        fieldName !== FIELD_NAMES.COUNTRY &&
        fieldName !== FIELD_NAMES.PROFESSION
      ) {
        if (fieldName === FIELD_NAMES.INSTRUCTIONS) {
          submitResponse(
            onboardingState.currentInputs.text.trim() ||
              "No specific instructions",
            "",
          );
        } else if (onboardingState.currentInputs.text.trim()) {
          submitResponse(onboardingState.currentInputs.text.trim());
        }
      }
    },
    [
      onboardingState.currentQuestionIndex,
      onboardingState.currentInputs.selectedCountry,
      onboardingState.currentInputs.text,
      handleCountrySelect,
      submitResponse,
    ],
  );

  const handleLetsGo = () => {
    // TODO: Navigate to main app or dashboard
  };

  useEffect(() => {
    const firstQuestion = questions[0];
    setOnboardingState((prev) => ({
      ...prev,
      messages: [
        {
          id: firstQuestion.id,
          type: "bot",
          content: firstQuestion.question,
        },
      ],
    }));
  }, []);

  return {
    onboardingState,
    messagesEndRef,
    inputRef,
    handleChipSelect,
    handleCountrySelect,
    handleProfessionSelect,
    handleProfessionInputChange,
    handleInputChange,
    handleSubmit,
    handleLetsGo,
  };
};
