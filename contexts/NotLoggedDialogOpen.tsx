import React, { createContext, useState, useContext, ReactNode } from "react";

interface NotLoggedDialogOpenContextType {
  notLoggedDialogOpen: boolean;
  setNotLoggedDialogOpen: React.Dispatch<React.SetStateAction<boolean>>;
}

const NotLoggedDialogOpenContext = createContext<
  NotLoggedDialogOpenContextType | undefined
>(undefined);

interface NotLoggedDialogOpenProviderProps {
  children: ReactNode;
}

export const NotLoggedDialogOpenProvider: React.FC<
  NotLoggedDialogOpenProviderProps
> = ({ children }) => {
  const [notLoggedDialogOpen, setNotLoggedDialogOpen] =
    useState<boolean>(false);

  return (
    <NotLoggedDialogOpenContext.Provider
      value={{ notLoggedDialogOpen, setNotLoggedDialogOpen }}
    >
      {children}
    </NotLoggedDialogOpenContext.Provider>
  );
};

export const useNotLoggedDialogOpen = (): NotLoggedDialogOpenContextType => {
  const context = useContext(NotLoggedDialogOpenContext);

  if (!context) {
    throw new Error(
      "useNotLoggedDialogOpen must be used within a NotLoggedDialogOpenProvider",
    );
  }

  return context;
};
