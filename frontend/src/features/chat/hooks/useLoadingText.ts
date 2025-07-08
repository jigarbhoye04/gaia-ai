"use client";
import { useDispatch, useSelector } from "react-redux";

import {
  resetLoadingText,
  setLoadingText,
} from "@/redux/slices/loadingTextSlice";
import { AppDispatch, RootState } from "@/redux/store";

interface ToolInfo {
  toolName?: string;
  toolCategory?: string;
}

export const useLoadingText = () => {
  const dispatch: AppDispatch = useDispatch();
  const { loadingText, toolInfo } = useSelector(
    (state: RootState) => state.loadingText,
  );

  const updateLoadingText = (text: string, toolInfo?: ToolInfo) => {
    if (toolInfo) {
      dispatch(setLoadingText({ text, toolInfo }));
    } else {
      dispatch(setLoadingText(text));
    }
  };

  const resetText = () => {
    dispatch(resetLoadingText());
  };

  return {
    loadingText,
    toolInfo,
    setLoadingText: updateLoadingText,
    resetLoadingText: resetText,
  };
};
