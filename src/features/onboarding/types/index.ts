export interface Message {
  id: string;
  type: "bot" | "user";
  content: string;
}

export interface Question {
  id: string;
  question: string;
  placeholder: string;
  fieldName: string;
  chipOptions?: { label: string; value: string }[];
}

export interface OnboardingState {
  messages: Message[];
  currentQuestionIndex: number;
  currentInputs: {
    text: string;
    selectedCountry: string | null;
    selectedProfession: string | null;
    selectedChips: Record<string, string[]>;
  };
  userResponses: Record<string, string>;
  isProcessing: boolean;
  isOnboardingComplete: boolean;
}

export interface ProfessionOption {
  label: string;
  value: string;
}
