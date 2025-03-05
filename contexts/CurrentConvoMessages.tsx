import React, { createContext, useContext, useState } from "react";

import { MessageType } from "@/types/convoTypes";

interface ConvoContextType {
  convoMessages: MessageType[];
  setConvoMessages: React.Dispatch<React.SetStateAction<MessageType[]>>;
  resetMessages: () => void;
}

const ConvoContext = createContext<ConvoContextType | undefined>(undefined);

export const ConvoProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [convoMessages, setConvoMessages] = useState<MessageType[]>([]);

  const resetMessages = () => {
    setConvoMessages([]);
  };

  return (
    <ConvoContext.Provider
      value={{ convoMessages, setConvoMessages, resetMessages }}
    >
      {children}
    </ConvoContext.Provider>
  );
};

export const useConvo = () => {
  const context = useContext(ConvoContext);

  if (!context) {
    throw new Error("useConvo must be used within a ConvoProvider");
  }

  return context;
};
